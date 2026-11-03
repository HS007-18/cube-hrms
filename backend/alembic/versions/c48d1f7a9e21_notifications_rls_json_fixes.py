"""notifications table, missing columns, JSON/tz fixes, RLS on new tables

Revision ID: c48d1f7a9e21
Revises: a296be198322
Create Date: 2026-11-03

The notifications table was never created by any migration (the ORM model
existed, so every /notifications endpoint raised), several columns that exist
in the models were never migrated, JSON payload columns were TEXT (breaking
pydantic List/Dict round-trips), and the 23 tables added in a296be198322 had
no row-level security at all.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c48d1f7a9e21"
down_revision: str | None = "a296be198322"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Tenant-scoped tables from a296be198322 that previously relied solely on
# application-level tenant filtering.
TENANT_SCOPED_TABLES = (
    "holidays",
    "subscriptions",
    "announcements",
    "invoices",
    "payrolls",
    "recruitments",
    "report_schedules",
    "reports",
    "support_tickets",
    "applications",
    "documents",
    "goals",
    "offboardings",
    "onboardings",
    "payroll_items",
    "ticket_comments",
    "goal_reviews",
    "offboarding_tasks",
    "onboarding_tasks",
)

# Platform-level tables: no tenant column, only reachable through
# platform-admin endpoints.
PLATFORM_ONLY_TABLES = (
    "system_alerts",
    "system_health_checks",
    "system_metrics",
    "platform_audit_logs",
)

# Columns holding JSON documents that were created as TEXT.
JSON_COLUMNS = (
    ("announcements", "target_user_ids"),
    ("reports", "parameters"),
    ("report_schedules", "parameters"),
    ("report_schedules", "recipients"),
    ("platform_audit_logs", "old_values"),
    ("platform_audit_logs", "new_values"),
    ("system_health_checks", "details"),
    ("system_metrics", "tags"),
)

TENANT_PREDICATE = (
    "tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint"
)
PLATFORM_PREDICATE = "current_setting('app.is_platform_admin', true) = 'true'"


def _enable_tenant_rls(table: str, *, allow_platform_rows: bool = False) -> None:
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
    predicate = TENANT_PREDICATE
    if allow_platform_rows:
        # Platform-wide rows (e.g. announcements for every tenant) keep a NULL
        # tenant_id and stay visible to all tenants.
        predicate = f"(tenant_id IS NULL OR {TENANT_PREDICATE})"
    op.execute(
        f"CREATE POLICY {table}_tenant_isolation ON {table} USING ({predicate})"
    )
    op.execute(
        f"CREATE POLICY {table}_platform_bypass ON {table} "
        f"USING ({PLATFORM_PREDICATE})"
    )


def _enable_platform_rls(table: str) -> None:
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
    op.execute(
        f"CREATE POLICY {table}_platform_admin_only ON {table} "
        f"USING ({PLATFORM_PREDICATE})"
    )


def _enable_self_tenant_rls(table: str) -> None:
    """Row-level rule for the tenant registry: a session may see its own
    tenant row, platform admins may see everything, nothing else."""
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
    op.execute(
        f"CREATE POLICY {table}_tenant_isolation ON {table} "
        f"USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)"
    )
    op.execute(
        f"CREATE POLICY {table}_platform_bypass ON {table} "
        f"USING ({PLATFORM_PREDICATE})"
    )


def upgrade() -> None:
    # --- notifications: model existed, no migration ever created the table ---
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=30), nullable=False),
        sa.Column(
            "priority",
            sa.String(length=20),
            server_default=sa.text("'normal'"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("action_url", sa.String(length=500), nullable=True),
        sa.Column("action_label", sa.String(length=50), nullable=True),
        sa.Column(
            "is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("related_entity_type", sa.String(length=50), nullable=True),
        sa.Column("related_entity_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("tenant_id", "user_id", "type", "is_read", "created_at"):
        op.create_index(
            op.f(f"ix_notifications_{column}"), "notifications", [column], unique=False
        )

    # --- columns present in the ORM models but never migrated ---
    op.add_column(
        "announcements",
        sa.Column(
            "is_pinned", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
    )
    op.add_column(
        "announcements",
        sa.Column(
            "is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
    )
    op.add_column(
        "report_schedules",
        sa.Column(
            "is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column(
            "auto_renew", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
    )
    op.add_column(
        "ticket_comments",
        sa.Column(
            "is_internal", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
    )
    op.add_column(
        "system_alerts",
        sa.Column(
            "is_resolved",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.create_index(
        op.f("ix_system_alerts_is_resolved"),
        "system_alerts",
        ["is_resolved"],
        unique=False,
    )

    # --- column corrections ---
    # The model and API treat source as optional; the table said NOT NULL.
    op.alter_column(
        "system_alerts",
        "source",
        existing_type=sa.String(),
        nullable=True,
        existing_nullable=False,
    )
    # All other timestamps are timestamptz; this one was created naive.
    # Existing values are UTC wall-clock (server TimeZone is UTC), so the
    # conversion labels them UTC rather than shifting them.
    op.alter_column(
        "system_alerts",
        "resolved_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
        postgresql_using="resolved_at AT TIME ZONE 'UTC'",
    )

    # --- TEXT columns carrying JSON documents -> json ---
    for table, column in JSON_COLUMNS:
        op.alter_column(
            table,
            column,
            existing_type=sa.Text(),
            type_=sa.JSON(),
            existing_nullable=True,
            postgresql_using=f"{column}::json",
        )

    # --- row-level security for the tables added in a296be198322 ---
    for table in TENANT_SCOPED_TABLES:
        _enable_tenant_rls(table)
    _enable_tenant_rls("notifications", allow_platform_rows=True)
    for table in PLATFORM_ONLY_TABLES:
        _enable_platform_rls(table)
    # The tenant registry itself: sessions only ever see their own row.
    _enable_self_tenant_rls("tenants")


def downgrade() -> None:
    for table in PLATFORM_ONLY_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_platform_admin_only ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
    for table in (*TENANT_SCOPED_TABLES, "notifications", "tenants"):
        op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
        op.execute(f"DROP POLICY IF EXISTS {table}_platform_bypass ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    for table, column in reversed(JSON_COLUMNS):
        op.alter_column(
            table,
            column,
            existing_type=sa.JSON(),
            type_=sa.Text(),
            existing_nullable=True,
            postgresql_using=f"{column}::text",
        )
    op.alter_column(
        "system_alerts",
        "resolved_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        existing_nullable=True,
        postgresql_using="resolved_at AT TIME ZONE 'UTC'",
    )
    # Best effort: fails if NULLs were written while source was optional.
    op.alter_column(
        "system_alerts",
        "source",
        existing_type=sa.String(),
        nullable=False,
        existing_nullable=True,
    )
    op.drop_column("system_alerts", "is_resolved")
    op.drop_column("ticket_comments", "is_internal")
    op.drop_column("subscriptions", "auto_renew")
    op.drop_column("report_schedules", "is_active")
    op.drop_column("announcements", "is_active")
    op.drop_column("announcements", "is_pinned")
    op.drop_table("notifications")
