import sys
import logging
import os
from datetime import datetime
import mss
from PIL import Image

# Configure logging to a file on the Desktop
desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
log_file = os.path.join(desktop_path, "hashtag_crm.log")
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

RESIZE_FACTOR = 0.5  # Resize screenshots to 50% to reduce size

def capture_screenshot(output_path):
    try:
        with mss.mss() as sct:
            logger.info("Capturing screenshot...")
            # Capture all monitors
            screenshots = []
            for monitor in sct.monitors[1:]:  # Skip the "all monitors" entry
                sct_img = sct.grab(monitor)
                img = Image.frombytes("RGB", sct_img.size, sct_img.rgb)
                screenshots.append(img)
            
            if screenshots:
                # Merge into one image
                total_width = sum(img.width for img in screenshots)
                max_height = max(img.height for img in screenshots)
                merged = Image.new("RGB", (total_width, max_height))
                x_offset = 0
                for img in screenshots:
                    merged.paste(img, (x_offset, 0))
                    x_offset += img.width
                
                # Resize to reduce size
                if RESIZE_FACTOR < 1.0:
                    merged = merged.resize(
                        (int(total_width * RESIZE_FACTOR), int(max_height * RESIZE_FACTOR)),
                        Image.Resampling.LANCZOS
                    )
                
                # Save to the specified output path
                merged.save(output_path, format="PNG")
                logger.info(f"Screenshot saved to {output_path}")
            else:
                logger.error("No screenshots captured")
                sys.exit(1)
    except Exception as e:
        logger.error(f"Screenshot capture failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("No output file path provided")
        print("Error: Output file path not provided")
        sys.exit(1)
    output_path = sys.argv[1]
    capture_screenshot(output_path)