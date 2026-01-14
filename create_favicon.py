"""
Generate optimized favicon from sky-objects.png
- Makes background transparent
- Creates proper sizing for favicon (32x32 or 64x64)
- Centers and scales the content appropriately
"""
from PIL import Image, ImageDraw
import os

def create_favicon():
    # Load the original image
    input_path = "assets/sky-objects.png"
    output_path = "assets/favicon.png"
    
    try:
        img = Image.open(input_path)
        print(f"Original size: {img.size}")
        print(f"Original mode: {img.mode}")
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get the data
        data = img.getdata()
        
        # Make white/near-white pixels transparent
        new_data = []
        for item in data:
            # If pixel is white or near-white (adjust threshold as needed)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                # Make it transparent
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        
        # Get bounding box of non-transparent content
        bbox = img.getbbox()
        if bbox:
            # Crop to content
            img = img.crop(bbox)
            print(f"Cropped size: {img.size}")
        
        # Create a new square image with padding
        max_dim = max(img.size)
        # Add 20% padding
        padding = int(max_dim * 0.2)
        new_size = max_dim + padding * 2
        
        # Create new transparent image
        new_img = Image.new('RGBA', (new_size, new_size), (255, 255, 255, 0))
        
        # Paste centered
        offset_x = (new_size - img.size[0]) // 2
        offset_y = (new_size - img.size[1]) // 2
        new_img.paste(img, (offset_x, offset_y), img)
        
        # Resize to optimal favicon size (64x64 for high DPI)
        final_size = 64
        new_img = new_img.resize((final_size, final_size), Image.Resampling.LANCZOS)
        
        # Save
        new_img.save(output_path, 'PNG', optimize=True)
        print(f"Saved favicon: {output_path} ({final_size}x{final_size})")
        
        # Also create a 32x32 version
        output_path_32 = "assets/favicon-32.png"
        new_img_32 = new_img.resize((32, 32), Image.Resampling.LANCZOS)
        new_img_32.save(output_path_32, 'PNG', optimize=True)
        print(f"Saved favicon: {output_path_32} (32x32)")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    os.chdir("frontend")
    create_favicon()
