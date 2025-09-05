import subprocess
import argparse
import os

def compress_video(input_path, output_path, crf=28):
    """
    Compresses a video file using ffmpeg.

    Args:
        input_path (str): Path to the input video file.
        output_path (str): Path to save the compressed video file.
        crf (int): Constant Rate Factor (lower values mean higher quality,
                   higher values mean smaller file size). Default is 28.
    """
    if not os.path.exists(input_path):
        print(f"Error: Input file not found at {input_path}")
        return

    # Construct the ffmpeg command
    # -i : input file
    # -c:v libx264 : use the H.264 codec
    # -crf : Constant Rate Factor for quality/size trade-off
    # -preset veryslow : encoding speed vs compression efficiency (slower means better compression)
    # -c:a copy : copy the audio stream without re-encoding (usually audio size is small)
    # -y : overwrite output file if it exists
    command = [
        'ffmpeg',
        '-i', input_path,
        '-c:v', 'libx264',
        '-crf', str(crf),
        '-preset', 'veryslow',
        '-c:a', 'copy',
        '-y', # Overwrite output file if it exists
        output_path
    ]

    print(f"Running command: {' '.join(command)}")

    try:
        process = subprocess.run(command, check=True, capture_output=True, text=True)
        print("FFmpeg stdout:")
        print(process.stdout)
        print("FFmpeg stderr:")
        print(process.stderr)
        print(f"Video successfully compressed and saved to {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error during compression: {e}")
        print("FFmpeg stdout:")
        print(e.stdout)
        print("FFmpeg stderr:")
        print(e.stderr)
    except FileNotFoundError:
        print("Error: ffmpeg not found. Please ensure it is installed and in your PATH.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compress an MP4 video file using ffmpeg.")
    parser.add_argument("input_file", help="Path to the input MP4 file.")
    parser.add_argument("--crf", type=int, default=28,
                        help="Constant Rate Factor (CRF) for video quality/compression (default: 28). Higher values mean more compression, lower quality.")

    args = parser.parse_args()

    # Generate the output file path
    input_path = args.input_file
    base_name, ext = os.path.splitext(input_path)
    output_path = f"{base_name}-comp{ext}"

    print(f"Input file: {input_path}")
    print(f"Output file will be: {output_path}")

    compress_video(input_path, output_path, args.crf)
