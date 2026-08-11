from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).parent
source_root = Path(r"C:\Users\amohm\.codex\generated_images\019ff137-aa87-7bf0-b2b7-0c233b1dbf8a")
items = {
    "home": source_root / "exec-3751230a-6878-4a18-b62c-468e81f9ce0b.png",
    "login": source_root / "exec-196ff367-c077-46a4-86bd-433abf840632.png",
    "teacher": source_root / "exec-1e259655-dc96-4299-95f2-cb1b0a070248.png",
    "admin": source_root / "exec-ea52ffe4-7ca4-4d11-b36b-16fc5febebb4.png",
}

for name, source_path in items.items():
    source = Image.open(source_path).convert("RGB")
    implementation = Image.open(root / f"qa-{name}.png").convert("RGB")
    target_width = 1200
    target_height = round(source.height * target_width / source.width)
    target = (target_width, target_height)
    source = source.resize(target, Image.Resampling.LANCZOS)
    implementation = implementation.resize(target, Image.Resampling.LANCZOS)
    gap, label = 28, 42
    canvas = Image.new("RGB", (target_width, (target_height + label) * 2 + gap), "#e8ecee")
    draw = ImageDraw.Draw(canvas)
    draw.text((14, 17), "SOURCE", fill="#102f3f")
    draw.text((14, target_height + label + gap + 14), "IMPLEMENTATION", fill="#102f3f")
    canvas.paste(source, (0, label))
    canvas.paste(implementation, (0, target_height + label * 2 + gap))
    canvas.save(root / f"qa-{name}-comparison.png")

    if name == "home":
        raw = Image.open(root / "qa-home.png").convert("RGB")
        raw.crop((700, 0, raw.width, 720)).save(root / "qa-home-right-focus.png")
