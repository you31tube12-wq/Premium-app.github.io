// ១. លេខកូដសម្ងាត់សម្រាប់ចូល Admin
const SECRET_KEY = "0319995568";

// ២. មុខងារ Login Admin
function loginAdmin() {
    Swal.fire({
        title: '🔒 តំបន់ត្រួតពិនិត្យ Admin',
        input: 'password',
        inputPlaceholder: 'បញ្ចូលលេខកូដសម្ងាត់...',
        showCancelButton: true,
        confirmButtonColor: '#00a8ff',
        confirmButtonText: 'ចូលប្រើ',
        cancelButtonText: 'បោះបង់'
    }).then((result) => {
        if (result.isConfirmed) {
            if (result.value === SECRET_KEY) {
                openAdminPanel();
            } else {
                Swal.fire('ខុសហើយ!', 'លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ', 'error');
            }
        }
    });
}

// ៣. បើកផ្ទាំង Admin និងបង្ហាញទិន្នន័យសម្រាប់កែ
function openAdminPanel() {
    document.getElementById('adminPanel').style.display = 'flex';
    renderAdminFields();
}

function renderAdminFields() {
    const box = document.getElementById('adminInputs');
    if (!box) return;

    // បង្កើត UI សម្រាប់កែ Rate របស់ Telegram Stars
    let html = `
        <div style="text-align:left; margin-bottom:20px; background:#f0f9ff; padding:15px; border-radius:15px;">
            <label style="font-weight:bold; color:#0088cc;">⭐️ Telegram Stars (1 Star = $):</label>
            <input type="number" id="adm_star_rate" step="0.0001" value="${services.stars.rate}" style="width:100%; padding:10px; margin-top:8px; border-radius:10px; border:1px solid #b3e5fc;">
        </div>
        <hr style="border:0; border-top:1px dashed #ddd; margin:20px 0;">
    `;

    // បង្កើតជួរកែប្រែសម្រាប់ Premium និង YouTube
    const keys = ['premium', 'youtube'];
    keys.forEach(key => {
        html += `
            <div style="text-align:left; margin-bottom:25px;">
                <label style="font-weight:bold; color:#333; text-transform:uppercase; font-size:13px;">📊 គ្រប់គ្រងគម្រោង ${services[key].title}:</label>
                <div id="list_${key}" style="margin-top:10px;"></div>
                <button onclick="addNewPlan('${key}')" style="background:#eee; border:none; padding:8px; border-radius:8px; width:100%; cursor:pointer; font-size:12px; margin-top:5px; color:#666;">+ បន្ថែមគម្រោងថ្មី</button>
            </div>
        `;
    });

    box.innerHTML = html;

    // បង្ហាញជួរនីមួយៗ (Rows)
    keys.forEach(key => {
        const container = document.getElementById(`list_${key}`);
        services[key].items.forEach((item, index) => {
            const row = document.createElement('div');
            row.style.display = "flex";
            row.style.gap = "5px";
            row.style.marginBottom = "8px";
            row.innerHTML = `
                <input type="text" value="${item.n}" onchange="updateLocalData('${key}', ${index}, 'n', this.value)" placeholder="ឈ្មោះគម្រោង" style="flex:2; padding:8px; font-size:12px; border-radius:8px; border:1px solid #eee;">
                <input type="number" value="${item.p}" onchange="updateLocalData('${key}', ${index}, 'p', this.value)" placeholder="តម្លៃ" style="flex:1; padding:8px; font-size:12px; border-radius:8px; border:1px solid #eee;">
                <button onclick="removePlan('${key}', ${index})" style="background:#ff7675; color:white; border:none; border-radius:8px; padding:0 10px; cursor:pointer;">×</button>
            `;
            container.appendChild(row);
        });
    });
}

// ៤. មុខងារជំនួយសម្រាប់កែប្រែទិន្នន័យបណ្ដោះអាសន្ន
function updateLocalData(key, index, field, value) {
    services[key].items[index][field] = (field === 'p') ? parseFloat(value) : value;
}

function addNewPlan(key) {
    services[key].items.push({ n: "គម្រោងថ្មី", p: 0 });
    renderAdminFields();
}

function removePlan(key, index) {
    services[key].items.splice(index, 1);
    renderAdminFields();
}

// ៥. រក្សាទុកទិន្នន័យទៅកាន់ Firebase ជាស្ថាពរ
function saveAdminChanges() {
    // ទាញយកតម្លៃ Rate Stars ចុងក្រោយពី Input
    services.stars.rate = parseFloat(document.getElementById('adm_star_rate').value);

    Swal.fire({
        title: 'កំពុងរក្សាទុក...',
        text: 'ទិន្នន័យកំពុងបញ្ជូនទៅ Firebase',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    // បញ្ជូនទៅ Firebase
    db.ref('imra_store/services').set(services)
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'ជោគជ័យ!',
                text: 'តម្លៃសេវាកម្មត្រូវបានអាប់ដេតលើ Cloud រួចរាល់',
                timer: 2000
            });
            closeAdmin();
        })
        .catch((error) => {
            Swal.fire('បរាជ័យ!', 'មិនអាចរក្សាទុកបានទេ៖ ' + error.message, 'error');
        });
}

function closeAdmin() {
    document.getElementById('adminPanel').style.display = 'none';
}

