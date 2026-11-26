
from PIL import Image, ImageDraw
from pathlib import Path

Path("public/icons").mkdir(
    parents=True, exist_ok=True
)

for size in [180, 192, 512]:
    image = Image.new(
        "RGB", (512, 512), "#234d3c"
    )

    draw = ImageDraw.Draw(image)

    # Calendar outline
    draw.rounded_rectangle(
        (110, 130, 402, 419),
        radius=40,
        outline="white",
        width=16
    )

    # Calendar header
    draw.line(
        (110, 208, 402, 208),
        fill="white",
        width=16
    )

    # Calendar rings
    for x in [184, 328]:
        draw.rounded_rectangle(
            (x-10, 98, x+10, 166),
            radius=10,
            fill="white"
        )

    # Availability colors
    colors = [
        "#62ae78", "#e9c34d", "#dc6262",
        "#62ae78", "#62ae78", "#e9c34d"
    ]

    for i, color in enumerate(colors):
        x = 147 + (i % 3) * 80
        y = 240 + (i // 3) * 75

        draw.rounded_rectangle(
            (x, y, x+58, y+53),
            radius=13,
            fill=color
        )

    image = image.resize(
        (size, size),
        Image.Resampling.LANCZOS
    )

    image.save(f"public/icons/icon-{size}.png")

print("Gatherly app icons created successfully!")
