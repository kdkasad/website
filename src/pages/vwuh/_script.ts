const droidSerif = new FontFace(
    "DroidSerif",
    "url(/assets/DroidSerif-Italic.ttf)",
);
document.fonts.add(droidSerif);
droidSerif.load();

const dropZone = document.getElementById("drop-zone") as HTMLLabelElement;
const fileInput = document.querySelector(
    "#drop-zone input[type=file]",
) as HTMLInputElement;
const dropForm = document.querySelector("form") as HTMLFormElement;
const result = document.getElementById("result") as HTMLElement;
const outputImg = document.getElementById("output") as HTMLImageElement;
const downloadBtn = document.getElementById("download") as HTMLAnchorElement;
const copyBtn = document.getElementById("copy") as HTMLButtonElement;
const tryAnotherBtn = document.getElementById(
    "try-another",
) as HTMLButtonElement;

let outputBlob: Blob | null = null;
let outputUrl: string | null = null;

async function processFile(file: File): Promise<void> {
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
        const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
        const ctx = canvas.getContext("2d")!;

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(imageUrl);

        await droidSerif.loaded;

        const fontSize = Math.max(16, img.naturalHeight * 0.022);
        const padding = fontSize * 2.4;

        ctx.font = `${fontSize}px "DroidSerif"`;
        ctx.fillStyle = "white";

        const x = padding;
        const y = img.naturalHeight - padding;

        ctx.fillText("vwuh", x, y);

        const blob = await canvas.convertToBlob({ type: "image/png" });

        if (outputUrl) URL.revokeObjectURL(outputUrl);
        outputBlob = blob;
        outputUrl = URL.createObjectURL(blob);

        outputImg.src = outputUrl;
        downloadBtn.href = outputUrl;

        dropForm.classList.add("hidden");
        result.classList.replace("hidden", "flex");
    };

    img.src = imageUrl;
}

// Drag and drop
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("bg-accent/60");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("bg-accent/60");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("bg-accent/60");
    const file = e.dataTransfer?.files[0];
    if (file?.type.startsWith("image/")) processFile(file);
});

// Click to select
fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) processFile(file);
});

// Download
downloadBtn.download = "vwuh.png";

// Copy
copyBtn.addEventListener("click", async () => {
    if (!outputBlob) return;
    await navigator.clipboard.write([
        new ClipboardItem({ "image/png": outputBlob }),
    ]);
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
        copyBtn.textContent = original;
    }, 1500);
});

// Try another
tryAnotherBtn.addEventListener("click", () => {
    result.classList.replace("flex", "hidden");
    dropForm.classList.remove("hidden");
    fileInput.value = "";
    outputImg.src = "";
});
