import { describe, expect, it } from 'vitest'
import { queryString } from './api'

describe('queryString', () => {
  it('encodes only provided values', () => {
    expect(
      queryString({ q: 'esha menon', status: 'pending', page: 2, empty: '', missing: undefined }),
    ).toBe('?q=esha+menon&status=pending&page=2')
  })

  it('returns an empty string when there is nothing to encode', () => {
    expect(queryString({})).toBe('')
    expect(queryString({ q: null, page: undefined })).toBe('')
  })
})
