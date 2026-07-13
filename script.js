const inputFoto = document.getElementById("input-foto");
const fotoUser = document.getElementById("foto-user");
const areaFoto = document.getElementById("area-foto");
const placeholder = document.getElementById("foto-placeholder");

const sliderZoom = document.getElementById("slider-zoom");
const btnReset = document.getElementById("btn-reset");
const btnDownload = document.getElementById("btn-download");

const nomeInput = document.getElementById("nome-corredor");
const textoNome = document.getElementById("texto-nome");

let scale = 1;
let posX = 0;
let posY = 0;
let fotoData = null;

function atualizarFoto(){
    fotoUser.style.transform =
        `translate(-50%, -50%) translate(${posX}px, ${posY}px) scale(${scale})`;
}

nomeInput.addEventListener("input", () => {
    textoNome.textContent = nomeInput.value.toUpperCase();
});

inputFoto.addEventListener("change", function(){
    const file = this.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(e){
        fotoData = e.target.result;

        fotoUser.src = fotoData;
        fotoUser.style.display = "block";
        placeholder.style.display = "none";

        scale = 1;
        posX = 0;
        posY = 0;
        sliderZoom.value = 100;

        atualizarFoto();
    };

    reader.readAsDataURL(file);
});

sliderZoom.addEventListener("input", () => {
    scale = Number(sliderZoom.value) / 100;
    atualizarFoto();
});

btnReset.addEventListener("click", () => {
    scale = 1;
    posX = 0;
    posY = 0;
    sliderZoom.value = 100;
    atualizarFoto();
});

let arrastando = false;
let inicioX = 0;
let inicioY = 0;

areaFoto.addEventListener("pointerdown", e => {
    arrastando = true;
    inicioX = e.clientX;
    inicioY = e.clientY;
    areaFoto.setPointerCapture(e.pointerId);
});

areaFoto.addEventListener("pointermove", e => {
    if(!arrastando) return;

    posX += e.clientX - inicioX;
    posY += e.clientY - inicioY;

    inicioX = e.clientX;
    inicioY = e.clientY;

    atualizarFoto();
});

areaFoto.addEventListener("pointerup", e => {
    arrastando = false;
    areaFoto.releasePointerCapture(e.pointerId);
});

function carregarImagem(src){
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

function roundedRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

btnDownload.addEventListener("click", async () => {
    btnDownload.textContent = "Gerando Card...";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1080;
    canvas.height = 1920;

    const fundo = await carregarImagem("fundo.png");

    ctx.drawImage(fundo, 0, 0, canvas.width, canvas.height);

    if(fotoData){
        const foto = await carregarImagem(fotoData);

        const areaX = canvas.width * 0.18;
        const areaY = canvas.height * 0.365;
        const areaW = canvas.width * 0.64;
        const areaH = canvas.height * 0.41;

        const proporcaoTelaX = areaW / areaFoto.clientWidth;
        const proporcaoTelaY = areaH / areaFoto.clientHeight;

        ctx.save();

        roundedRect(ctx, areaX, areaY, areaW, areaH, 45);
        ctx.clip();

        const baseScale = Math.max(
            areaW / foto.width,
            areaH / foto.height
        ) * scale;

        const drawW = foto.width * baseScale;
        const drawH = foto.height * baseScale;

        const drawX =
            areaX + areaW / 2 - drawW / 2 + posX * proporcaoTelaX;

        const drawY =
            areaY + areaH / 2 - drawH / 2 + posY * proporcaoTelaY;

        ctx.drawImage(foto, drawX, drawY, drawW, drawH);

        ctx.restore();
    }

    const nome = nomeInput.value.toUpperCase();

    if(nome){
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 72px Arial";

        const x = canvas.width / 2;
        const y = canvas.height * 0.655;

        ctx.lineWidth = 14;
        ctx.strokeStyle = "#06163d";
        ctx.strokeText(nome, x, y);

        ctx.fillStyle = "#ffffff";
        ctx.fillText(nome, x, y);
    }

    canvas.toBlob(async blob => {
        const file = new File([blob], "card-oficial.png", {
            type:"image/png"
        });

        if(navigator.canShare && navigator.canShare({files:[file]})){
            await navigator.share({
                title:"Meu Card",
                files:[file]
            });
        }else{
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "card-oficial.png";
            link.click();
        }

        btnDownload.textContent = "Salvar Card";
    });
});
