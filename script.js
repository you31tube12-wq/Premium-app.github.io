let services = {
    stars: { title: "TG Stars", logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg", label: "Username (@...):", rate: 0.022 },
    premium: { title: "Premium", logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg", label: "Username (@...):", items: [{n: "1 ខែ", p: 3.9}, {n: "1 ឆ្នាំ", p: 35}] },
    youtube: { title: "YouTube", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png", label: "Email (Gmail):", items: [{n: "1 ខែ", p: 2.0}, {n: "1 ឆ្នាំ", p: 18}] }
};

let currentSvc = "", finalItem = "", finalPrice = 0, checkInterval;

db.ref('imra_store/services').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) services = data;
    renderMainMenu();
});

function renderMainMenu() {
    const menu = document.getElementById('mainMenu');
    if(!menu) return;
    menu.innerHTML = "";
    for (let key in services) {
        menu.innerHTML += `
            <div class="item-card" onclick="openService('${key}')" style="background:white; padding:20px; border-radius:20px; text-align:center; cursor:pointer; box-shadow:0 5px 15px rgba(0,0,0,0.05);">
                <img src="${services[key].logo}" style="width:50px; height:50px; margin-bottom:10px; object-fit:contain;">
                <div style="font-size:14px; font-weight:bold;">${services[key].title}</div>
            </div>`;
    }
}

function openService(id) {
    currentSvc = id;
    const svc = services[id];
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('detailSection').style.display = 'block';
    document.getElementById('serviceTitle').innerText = svc.title;
    document.getElementById('serviceLogo').src = svc.logo;
    document.getElementById('inputLabel').innerText = svc.label;
    const grid = document.getElementById('priceGrid');
    const starsArea = document.getElementById('starsArea');
    grid.innerHTML = ""; finalPrice = 0; updateT();

    if(id === 'stars') {
        starsArea.style.display = 'block';
        grid.style.display = 'none';
    } else {
        starsArea.style.display = 'none';
        grid.style.display = 'grid';
        svc.items.forEach(item => {
            let div = document.createElement('div');
            div.className = 'price-item';
            div.innerHTML = `<div>${item.n}</div><b>$${item.p}</b>`;
            div.onclick = () => {
                document.querySelectorAll('.price-item').forEach(p => p.classList.remove('selected'));
                div.classList.add('selected');
                finalItem = item.n; finalPrice = item.p; updateT();
            };
            grid.appendChild(div);
        });
    }
}

async function processOrder() {
    let user = document.getElementById('userData').value;
    if(!user || finalPrice <= 0) return Swal.fire('បញ្ហា', 'សូមបំពេញព័ត៌មានឱ្យគ្រប់', 'warning');
    document.getElementById('invoiceModal').style.display = 'flex';
    document.getElementById('paymentStatus').innerText = "⏳ កំពុងបង្កើត QR Code...";
    try {
        const res = await fetch('http://localhost:5000/api/generate-qr', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ amount: finalPrice })
        });
        const d = await res.json();
        if(d.qr_string) {
            new QRious({ element: document.getElementById('qrCanvas'), value: d.qr_string, size: 300 });
            document.getElementById('paymentStatus').innerText = "⏳ រង់ចាំការបាញ់លុយ (Bakong)...";
            startCheck(d.md5);
        }
    } catch(e) { Swal.fire('Error', 'សូមបើក Python ក្នុង Pydroid 3 សិន!', 'error'); closeInv(); }
}

function startCheck(md5) {
    if(checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/check-status/${md5}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    service: services[currentSvc].title,
                    plan: finalItem,
                    amount: finalPrice,
                    user_info: document.getElementById('userData').value
                })
            });
            const d = await res.json();
            if(d.status === "SUCCESS") {
                clearInterval(checkInterval);
                Swal.fire('ជោគជ័យ', 'ទិន្នន័យបានផ្ញើទៅ Admin', 'success').then(() => location.reload());
            }
        } catch(e) {}
    }, 5000);
}

function updateT() { document.getElementById('totalDisplay').innerText = "$" + finalPrice; }
function goBack() { document.getElementById('mainMenu').style.display = 'grid'; document.getElementById('detailSection').style.display = 'none'; }
function closeInv() { clearInterval(checkInterval); document.getElementById('invoiceModal').style.display = 'none'; }
      
