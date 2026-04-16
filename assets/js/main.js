const kartaEdukiontzia = document.querySelector("#karta-edukiontzia");
const kartaEgoera = document.querySelector("#karta-egoera");
const API_KARTA_HELBIDEA = "http://localhost:5056/api/karta";
const AZKEN_UNITATEAK_MUGA = 3;
const pantailak = document.querySelectorAll("[data-pantaila]");
const pantailaLoturak = document.querySelectorAll("[data-pantaila-helburua]");
const akordeoiElementuak = document.querySelectorAll(".akordeoi-elementua");

function formatuPrezioa(prezioa) {
  return new Intl.NumberFormat("eu-ES", {
    style: "currency",
    currency: "EUR"
  }).format(prezioa);
}

function taldekatuKategoriaka(platerak) {
  return platerak.reduce((mapa, platera) => {
    if (!mapa.has(platera.kategoria)) {
      mapa.set(platera.kategoria, []);
    }

    mapa.get(platera.kategoria).push(platera);
    return mapa;
  }, new Map());
}

function iragaziPlaterErakutsigarriak(platerak) {
  return platerak.filter((platera) => Number(platera.stock) > 0);
}

function aldatuPantaila(pantailaIzena) {
  pantailak.forEach((pantaila) => {
    const aktiboa = pantaila.dataset.pantaila === pantailaIzena;
    pantaila.hidden = !aktiboa;
    pantaila.classList.toggle("pantaila-aktiboa", aktiboa);
  });

  pantailaLoturak.forEach((lotura) => {
    const aktiboa = lotura.dataset.pantailaHelburua === pantailaIzena;
    lotura.setAttribute("aria-current", aktiboa ? "page" : "false");
  });

  document.body.classList.toggle("menu-irekita", pantailaIzena === "karta");
}

function eguneratuAkordeoiAltura(elementua, edukia, barrua) {
  if (elementua.classList.contains("irekita")) {
    edukia.style.height = `${barrua.scrollHeight}px`;
  } else {
    edukia.style.height = "0px";
  }
}

function prestatuAkordeoiak() {
  akordeoiElementuak.forEach((elementua) => {
    const laburpena = elementua.querySelector("summary");
    const edukia = elementua.querySelector(".akordeoi-edukia");

    if (!laburpena || !edukia) {
      return;
    }

    let barrua = edukia.querySelector(".akordeoi-edukia-barrua");

    if (!barrua) {
      barrua = document.createElement("div");
      barrua.className = "akordeoi-edukia-barrua";

      while (edukia.firstChild) {
        barrua.appendChild(edukia.firstChild);
      }

      edukia.appendChild(barrua);
    }

    const hasieranIrekita = elementua.hasAttribute("open");
    elementua.classList.toggle("irekita", hasieranIrekita);
    if (!hasieranIrekita) {
      elementua.removeAttribute("open");
    }
    eguneratuAkordeoiAltura(elementua, edukia, barrua);

    laburpena.addEventListener("click", (gertaera) => {
      gertaera.preventDefault();

      const irekita = elementua.classList.contains("irekita");
      elementua.classList.add("animatzen");

      if (irekita) {
        edukia.style.height = `${barrua.scrollHeight}px`;
        requestAnimationFrame(() => {
          elementua.classList.remove("irekita");
          edukia.style.height = "0px";
        });
      } else {
        elementua.setAttribute("open", "");
        elementua.classList.add("irekita");
        edukia.style.height = "0px";
        requestAnimationFrame(() => {
          edukia.style.height = `${barrua.scrollHeight}px`;
        });
      }
    });

    edukia.addEventListener("transitionend", (gertaera) => {
      if (gertaera.propertyName !== "height") {
        return;
      }

      const irekita = elementua.classList.contains("irekita");
      if (!irekita) {
        elementua.removeAttribute("open");
      } else {
        edukia.style.height = `${barrua.scrollHeight}px`;
      }

      elementua.classList.remove("animatzen");
    });
  });

  window.addEventListener("resize", () => {
    akordeoiElementuak.forEach((elementua) => {
      const edukia = elementua.querySelector(".akordeoi-edukia");
      const barrua = elementua.querySelector(".akordeoi-edukia-barrua");

      if (!edukia || !barrua) {
        return;
      }

      eguneratuAkordeoiAltura(elementua, edukia, barrua);
    });
  });
}

function erakutsiKarta(platerak) {
  if (!kartaEdukiontzia || !kartaEgoera) {
    return;
  }

  kartaEdukiontzia.innerHTML = "";

  const platerErakutsigarriak = iragaziPlaterErakutsigarriak(platerak);

  if (!platerErakutsigarriak.length) {
    kartaEgoera.textContent = "Ez dago kartako platerik erabilgarri une honetan.";
    return;
  }

  const kategoriak = taldekatuKategoriaka(platerErakutsigarriak);

  kategoriak.forEach((kategoriakoPlaterak, kategoria) => {
    const atal = document.createElement("section");
    atal.className = "karta-kategoria";

    const izenburua = document.createElement("h3");
    izenburua.className = "karta-kategoria-izena";
    izenburua.textContent = kategoria;
    atal.appendChild(izenburua);

    const zerrenda = document.createElement("div");
    zerrenda.className = "karta-zerrenda";

    kategoriakoPlaterak.forEach((platera) => {
      const artikulua = document.createElement("article");
      artikulua.className = "karta-lerroa";
      const azkenUnitateak = Number(platera.stock) <= AZKEN_UNITATEAK_MUGA;

      const osagaienTestua = Array.isArray(platera.osagaiak) && platera.osagaiak.length
        ? platera.osagaiak.join(", ")
        : "Osagaien informaziorik ez dago erabilgarri.";

      const stockAbisua = azkenUnitateak
        ? `<span class="stock-oharra">Azken unitateak</span>`
        : "";

      artikulua.innerHTML = `
        <div class="karta-lerro-goiburua">
          <h4>${platera.izena}</h4>
          <span class="karta-puntudun-bereizlea" aria-hidden="true"></span>
          <span class="prezioa">${formatuPrezioa(platera.prezioa)}</span>
        </div>
        ${stockAbisua}
        <p class="karta-lerro-osagaiak">${osagaienTestua}</p>
      `;

      zerrenda.appendChild(artikulua);
    });

    atal.appendChild(zerrenda);
    kartaEdukiontzia.appendChild(atal);
  });

  kartaEgoera.textContent =
    "Karta datu-basetik zuzenean kargatu da.";
}

function erakutsiErrorea() {
  if (!kartaEdukiontzia || !kartaEgoera) {
    return;
  }

  kartaEdukiontzia.innerHTML = "";
  kartaEgoera.textContent =
    "Ezin izan da karta kargatu. Ziurtatu APIa martxan dagoela eta datu-basearekin konektatuta dagoela.";
}

async function kargatuKarta() {
  if (!kartaEgoera) {
    return;
  }

  kartaEgoera.textContent = "Karta datu-basetik kargatzen...";

  try {
    const erantzuna = await fetch(API_KARTA_HELBIDEA);

    if (!erantzuna.ok) {
      throw new Error("API erantzun okerra");
    }

    const platerak = await erantzuna.json();
    erakutsiKarta(platerak);
  } catch (errorea) {
    console.error("Errorea karta kargatzean:", errorea);
    erakutsiErrorea();
  }
}

pantailaLoturak.forEach((lotura) => {
  lotura.addEventListener("click", (gertaera) => {
    const helburua = lotura.dataset.pantailaHelburua;
    if (!helburua) {
      return;
    }

    gertaera.preventDefault();
    aldatuPantaila(helburua);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

const hasierakoPantaila = window.location.hash === "#karta" ? "karta" : "hasiera";
aldatuPantaila(hasierakoPantaila);
prestatuAkordeoiak();
kargatuKarta();
