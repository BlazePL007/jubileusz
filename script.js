const sheetUrlimages = 'https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vQ_ND2dfb7MVHHUCsYM4AijZ_lJqeTXV_7LRyxpGFqel707J05lEMOcGfMIokabqLq7QkbBUwR8jPxF/pubhtml/sheet?headers=false&gid=0';

const sheetUrlMarbles = 'https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vQ_ND2dfb7MVHHUCsYM4AijZ_lJqeTXV_7LRyxpGFqel707J05lEMOcGfMIokabqLq7QkbBUwR8jPxF/pubhtml/sheet?headers=false&gid=2050292709';

const sheetUrlBrainShow = 'https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vQ_ND2dfb7MVHHUCsYM4AijZ_lJqeTXV_7LRyxpGFqel707J05lEMOcGfMIokabqLq7QkbBUwR8jPxF/pubhtml/sheet?headers=false&gid=1683356584';

const sheetUrlScribbleio = 'https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vQ_ND2dfb7MVHHUCsYM4AijZ_lJqeTXV_7LRyxpGFqel707J05lEMOcGfMIokabqLq7QkbBUwR8jPxF/pubhtml/sheet?headers=false&gid=1538371344';

let data = null;
let datasets = null;

async function loads() {
  let urls = [sheetUrlimages, sheetUrlMarbles, sheetUrlBrainShow, sheetUrlScribbleio];
  const parser = new DOMParser();
  data = await Promise.all(
    urls.map(url => fetch(url))
  );
  data = await Promise.all(
    data.map(res => res.text())
  );

  datasets = {
    marbles: parseSheetligi(data[1]),
    brainshow: parseSheetligi(data[2]),
    scribblio: parseSheetligi(data[3])
  }
}

function activateHistoriaEvents() {
  const items = document.querySelectorAll(".item-hist");
  if (!items) return;

  items.forEach(item => {
    const header = item.querySelector(".header-hist");
    const panel = item.querySelector(".content-hist");

    header.addEventListener("click", () => {
      item.classList.toggle("active");

      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });

    // 🔥 KLUCZOWE: reaguj na ładowanie obrazów
    const images = panel.querySelectorAll("img");

    images.forEach(img => {
      img.addEventListener("load", () => {
        if (item.classList.contains("active")) {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  });
}



let actualnapostrona = "";
let cache = {};

async function loadSection(name) {
  if (actualnapostrona !== name) {
    try {
      if (cache[name]) {
        document.getElementById("content").innerHTML = cache[name];
      } else {
        const res = await fetch(`${name}.html`);
        const html = await res.text();
        cache[name] = html; // zapis do cache
        document.getElementById("content").innerHTML = html;
      }
      actualnapostrona = name;

      if(name==="historia"){
        activateHistoriaEvents();
      }

      if(name==="nagrody"){
        createSlots();
      }

      if(name==="ligi"){
        setupTabs();
        renderTable([...datasets.brainshow]);
      }

      if(name==="galeria"){
        setupGalleryModal();
      }
    } catch (error) {
      console.error("Błąd ładowania sekcji:", error);
    }
  }
}


async function preloadSections(names) {
  await Promise.all(
  names.map(async (name) => {
    if (!cache[name]) {
      const res = await fetch(`${name}.html`);
      cache[name] = await res.text();
    }
  })
  );
}

function loadimages(){
  const htmlText = data[0];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
   
  const rows = Array.from(doc.querySelectorAll('table tr'));

  let zdjecia = {};

  rows.forEach(row =>{
    const cells = row.querySelectorAll('td');
    if (cells.length >=2){
      let link = cells[0].textContent.trim()
      let gdzie = cells[1].textContent.trim()

      if(!zdjecia[gdzie])
        zdjecia[gdzie] = {
          gdzie,
          linki:[]
        }
      if(link){
        zdjecia[gdzie].linki.push(`${link}`);
      }


    }
  });
  console.log(zdjecia)
  renderimages(zdjecia)
}

function renderimages(zdjecia){
  Object.entries(cache).forEach(([name, html]) => {

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    Object.values(zdjecia).forEach(({gdzie, linki}) => {
      const el = doc.getElementById(gdzie);
      if (!el) return;

      // 🔹 przypadek IMG
      if (el.tagName === "IMG") {
        if (linki.length > 0) {
          el.src = linki[0];
        }
      }

      // 🔹 przypadek DIV (galeria)
      if (el.tagName === "DIV") {
        el.innerHTML = ""; // czyścimy

        linki.forEach(link => {
          const img = document.createElement("img");
          img.src = link;
          img.classList.add("gallery-image");
          el.appendChild(img);
        });
      }
    });

    // 🔥 zapisujemy zmodyfikowany HTML z powrotem do cache
    cache[name] = doc.body.innerHTML;
  });
}

function openModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const captionText = document.getElementById("caption");
  modal.style.display = "block";
  modalImg.src = src;
  captionText.innerHTML = ""; // Można dodać opis jeśli potrzeba
}

function closeModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none";
}

function setupGalleryModal() {
  const closeBtn = document.querySelector(".close");
  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }

  const modal = document.getElementById("imageModal");
  if (modal) {
    modal.onclick = function(event) {
      if (event.target === modal) {
        closeModal();
      }
    };
  }

  document.addEventListener("click", function(event) {
    if (event.target.classList.contains("gallery-image")) {
      openModal(event.target.src);
    }
  });
}

function parseSheetligi(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  const rows = [...doc.querySelectorAll('table tr')];

  const result = [];

  rows.forEach((row, index) => {
    if (index === 0) return; // pomijamy nagłówek

    const cells = [...row.querySelectorAll('td')];

    if (cells.length === 0) return;

    const player = cells[0].innerText.trim();

    if (!player) return;

    let punkty = 0;

    for (let i=1;i<cells.length;i++){
      const value = parseInt(cells[i].innerText.trim());
      if (!isNaN(value)) {
        punkty += value;
      }
    }

    result.push({ player, punkty });
  });

  return result;
}

async function init() {
  preloadSections(["wstęp", "historia", "galeria", "jubileusz", "atrakcje", "nagrody", "turnieje", "ligi"]);
  await loads();
  loadimages();
  loadSection("wstęp");

}

init();

/* 🔥 TUTAJ STERUJESZ */
const slotsData = {
    1: { title: "Slot 1", desc: "No picking", img: "img/1.png", locked: true },
    2: { title: "Slot 2", desc: "No picking", img: "img/2.png", locked: true },
    3: { title: "Slot 3", desc: "No picking", img: "img/3.png", locked: true },
    4: { title: "Czerwiec - CapitanSilence52", desc: "Minilodówka USB", img: "https://jagadzet.pl/images/jagadzet/5000-6000/Lodowka-USB-MA-_%5B5888%5D_480.jpg", locked: false },
    5: { title: "Slot 5", desc: "No picking", img: "img/5.png", locked: true },
    6: { title: "Kwiecień - f1shuu87", desc: "Głośnik mobilny MANTA SPK15GO-BK", img: "https://i.ibb.co/1t0XxY8k/kwiecien-f1shu87.jpg", locked: false },

    7: { title: "Marzec - f1shuu87", desc: "Clair Obscur: Expedition 33 Deluxe Edition", img: "https://i.ibb.co/0jX3pxLf/f1shuu-Marzec.png", locked: false },
    8: { title: "Lipiec - ThePingwin17", desc: "Stojak na słuchawki RGB", img: "https://cdn.x-kom.pl/i/setup/images/prod/big/product-new-big,,2023/1/pr_2023_1_25_11_1_58_829_00.jpg", locked: false },
    9: { title: "Luty - marcin25_96", desc: "Spider-Man 2 Deluxe Edition", img: "https://i.ibb.co/SFTyJqD/Marcin25-96-Luty.png", locked: false },
    10:{ title: "Maj - vaderq", desc: "Podkładka pod mysz", img: "https://i.ibb.co/gYbhgg2/Messenger-creation-B4-D39953-0-F37-4-C7-A-B8-B5-86518-D1-EAFA5.jpg", locked: false },
    11:{ title: "Sierpień - CapitanSilence52", desc: "Projektor", img: "https://ae-pic-a1.aliexpress-media.com/kf/S7463e0de41154d81b73d1900ee52cd76K.png_960x960.png_.avif", locked: false },
    12:{ title: "Styczeń - marcin25_96", desc: "PixelBox Mystery Box", img: "https://i.ibb.co/DgKGzd5r/marcin.jpg", locked: false }
};

/* GENEROWANIE SLOTÓW */
function createSlots() {
    const left = document.getElementById("leftSlots");
    const right = document.getElementById("rightSlots");

    left.innerHTML = "";
    right.innerHTML = "";

    for (let i = 1; i <= 12; i++) {
        const slot = document.createElement("div");
        slot.classList.add("slot");
        slot.innerText = i;

        if (slotsData[i].locked) {
            slot.classList.add("locked");
        } else {
            slot.onclick = () => selectSlot(i);
        }

        if (i <= 6) left.appendChild(slot);
        else right.appendChild(slot);
    }
}

function selectSlot(id) {
    const data = slotsData[id];

    document.getElementById("winner").innerText = data.title;
    document.getElementById("desc").innerText = data.desc;

    const img = document.getElementById("img");

    if (data.img) {
        img.src = data.img;
        img.classList.add("visible");
    } else {
        img.classList.remove("visible");
    }
}

function renderTable(data) {
  const container = document.getElementById("medal-table");
  container.innerHTML = "";

  // sortowanie malejąco
  data.sort((a, b) => b.punkty - a.punkty);

  const table = document.createElement("table");
  table.className = "medal-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Pozycja</th>
        <th>Zawodnik</th>
        <th>Punkty</th>
      </tr>
    </thead>
    <tbody>
      ${data.map((row, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${row.player}</td>
          <td>${row.punkty}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  container.appendChild(table);
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      
      // aktywny styl
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.dataset.tab;

      // render danych
      renderTable([...datasets[tab]]);
    });
  });
}