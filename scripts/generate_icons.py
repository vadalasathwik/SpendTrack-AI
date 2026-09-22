import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_gradient_icon(size, text="S", padding_ratio=0.0):
    # Create high-res image
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw dark emerald rounded rectangle background
    pad = int(size * padding_ratio)
    inner_size = size - (pad * 2)
    
    # Create base canvas for rounded box
    box_img = Image.new("RGBA", (inner_size, inner_size), (0, 0, 0, 0))
    box_draw = ImageDraw.Draw(box_img)
    
    # Radial/Linear Gradient background (Dark Slate #0F172A to Deep Emerald #064E3B & Emerald #10B981)
    corner_radius = int(inner_size * 0.22)
    
    for y in range(inner_size):
        for x in range(inner_size):
            # Calculate gradient factor
            factor = (x + y) / (inner_size * 2.0)
            r = int(15 + (16 - 15) * factor)
            g = int(23 + (185 - 23) * factor)
            b = int(42 + (129 - 42) * factor)
            box_img.putpixel((x, y), (r, g, b, 255))
            
    # Apply rounded mask
    mask = Image.new("L", (inner_size, inner_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, inner_size, inner_size], radius=corner_radius, fill=255)
    
    box_img.putalpha(mask)
    img.paste(box_img, (pad, pad), box_img)
    
    # Draw Monogram 'S' or SpendTrack Logo Icon
    draw = ImageDraw.Draw(img)
    
    # Try loading a bold font, fallback to default font with custom drawing
    font_size = int(size * (0.55 if padding_ratio == 0 else 0.40))
    font = None
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                pass
                
    if font:
        # Get bounding box of text 'S'
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (size - w) / 2 - bbox[0]
        y = (size - h) / 2 - bbox[1]
        
        # Add subtle drop shadow under 'S'
        shadow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow_img)
        s_draw.text((x + 2, y + 4), text, fill=(0, 0, 0, 120), font=font)
        shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=size * 0.02))
        img.paste(shadow_img, (0, 0), shadow_img)
        
        # Draw white 'S' text
        draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    else:
        # Fallback SVG-style geometric 'S' monogram drawing
        cx, cy = size / 2, size / 2
        r = size * 0.2
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 255), width=int(size * 0.08))

    return img

def main():
    public_dir = os.path.join(os.getcwd(), "public")
    os.makedirs(public_dir, exist_ok=True)
    
    print("Generating SpendTrack AI PWA icons...")
    
    # 1. Standard 192x192
    icon_192 = create_gradient_icon(192, "S")
    icon_192.save(os.path.join(public_dir, "pwa-192x192.png"))
    print("Created pwa-192x192.png")
    
    # 2. Standard 512x512
    icon_512 = create_gradient_icon(512, "S")
    icon_512.save(os.path.join(public_dir, "pwa-512x512.png"))
    print("Created pwa-512x512.png")
    
    # 3. Maskable 512x512 with safe padding (20%)
    maskable_512 = create_gradient_icon(512, "S", padding_ratio=0.10)
    maskable_512.save(os.path.join(public_dir, "maskable-icon-512x512.png"))
    print("Created maskable-icon-512x512.png")
    
    # 4. Apple touch icon (180x180)
    apple_180 = create_gradient_icon(180, "S")
    apple_180.save(os.path.join(public_dir, "apple-touch-icon.png"))
    print("Created apple-touch-icon.png")
    
    # 5. Favicon SVG
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="spendtrack_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#spendtrack_grad)"/>
  <text x="256" y="360" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="320" fill="#FFFFFF" text-anchor="middle" filter="url(#shadow)">S</text>
</svg>'''
    with open(os.path.join(public_dir, "favicon.svg"), "w") as f:
        f.write(svg_content)
    print("Created favicon.svg")
    
    print("All icons successfully generated!")

if __name__ == "__main__":
    main()
