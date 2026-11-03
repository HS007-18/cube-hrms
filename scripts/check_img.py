import sys
from PIL import Image

img = Image.open("frontend/public/cubeai-logo.png")
print("Mode:", img.mode, "Size:", img.size)

# Check top-left pixel
print("Top-left pixel (0,0):", img.getpixel((0, 0)))

# If background is white (255, 255, 255), let's create:
# 1. cubeai-logo-white-bg.png
# 2. cubeai-logo-transparent.png (with white made transparent or anti-aliased)
# 3. cubeai-icon-transparent.png (just the faceted cube icon)
# 4. cubeai-logo-dark.png (for dark background: white "CubeAI", cyan "Solutions")

rgba = img.convert("RGBA")
datas = rgba.getdata()

# Check icon bounding box:
# The cube is on the left
icon = img.crop((0, 0, int(img.width * 0.40), img.height))
icon.save("frontend/public/cubeai-icon.png")
print("Saved cubeai-icon.png")

# Now create transparent version:
new_data = []
for item in datas:
    # If pixel is near white
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

rgba.putdata(new_data)
rgba.save("frontend/public/cubeai-logo-transparent.png")
print("Saved cubeai-logo-transparent.png")

# Crop transparent icon
icon_trans = rgba.crop((0, 0, int(img.width * 0.40), img.height))
# trim transparent edges
bbox = icon_trans.getbbox()
if bbox:
    icon_trans = icon_trans.crop(bbox)
icon_trans.save("frontend/public/cubeai-icon-transparent.png")
print("Saved cubeai-icon-transparent.png with bbox:", bbox)

# Create white-text version for dark sidebar:
# "CubeAI" is dark navy (item[0]<50, item[1]<50, item[2]<80).
# For dark navy sidebar, make dark navy text white (255, 255, 255) so it stands out against #031B32!
dark_nav_data = []
for item in datas:
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        dark_nav_data.append((255, 255, 255, 0))
    # if it's the dark navy text "CubeAI" (mostly in the right half of image, x > 150)
    elif item[0] < 50 and item[1] < 60 and item[2] < 90:
        # replace with crisp white for dark sidebar
        dark_nav_data.append((255, 255, 255, item[3]))
    else:
        dark_nav_data.append(item)

dark_logo = Image.new("RGBA", img.size)
dark_logo.putdata(dark_nav_data)
dark_logo.save("frontend/public/cubeai-logo-dark.png")
print("Saved cubeai-logo-dark.png for dark background")

