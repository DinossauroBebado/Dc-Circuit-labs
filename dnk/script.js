// JAVASCRIPT LOGIC - DC CIRCUIT LABS INTERACTIVE CONFIGURATOR

document.addEventListener('DOMContentLoaded', () => {
    // CLIENT AUTHENTICATION LOGIC
    const CLIENT_PASSWORD = '0cxjCsTH7Ei6bp2rvhfs';
    const authOverlay = document.getElementById('auth-overlay');
    const authCard = document.getElementById('auth-card');
    const authForm = document.getElementById('auth-form');
    const passwordInput = document.getElementById('client-password');
    const authErrorMsg = document.getElementById('auth-error-msg');
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');

    // Check if already authenticated in session
    if (sessionStorage.getItem('dnk_auth_access') === 'granted') {
        document.body.classList.remove('locked');
        if (authOverlay) authOverlay.classList.add('hidden');
    } else {
        document.body.classList.add('locked');
        if (authOverlay) authOverlay.classList.remove('hidden');
    }

    // Toggle Password Visibility
    if (togglePwdBtn && passwordInput) {
        togglePwdBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePwdBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                togglePwdBtn.textContent = '👁️';
            }
        });
    }

    // Auth Form Submission
    if (authForm && passwordInput) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredPwd = passwordInput.value.trim();

            if (enteredPwd === CLIENT_PASSWORD) {
                // Success: Unlock page
                sessionStorage.setItem('dnk_auth_access', 'granted');
                if (authErrorMsg) authErrorMsg.style.display = 'none';
                if (authOverlay) authOverlay.classList.add('hidden');
                document.body.classList.remove('locked');
            } else {
                // Wrong password: Shake card and show error
                if (authErrorMsg) authErrorMsg.style.display = 'block';
                if (authCard) {
                    authCard.classList.add('shake');
                    setTimeout(() => {
                        authCard.classList.remove('shake');
                    }, 400);
                }
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    // Selected options state
    const selections = {
        display: 'display_s3_cap',
        bateria: 'makita5ah',
        pcb: 'pcb_top',
        carcaca: 'hibrida',
        acabamento: 'filme_policarbonato',
        tracao: 'ac_trifasico',
        ponteh: 'ponteh_bts',
        protocolo: 'modbus_tcp',
        sensores: 'sensor_completo'
    };

    // Database of item specifications
    const itemDetails = {
        // Display HMI 7" (Padrão Unificado)
        display_s3_cap: {
            title: 'Display Touch 7.0" ESP32-S3 Capacitivo (Sunton/Smart HMI)',
            price: 450,
            group: 'controle',
            display: '7" S3 Capacitivo',
            desc: 'Tela capacitiva multi-touch de alta sensibilidade com vidro protetor e LVGL Open Source.'
        },

        // Bateria
        makita5ah: {
            title: 'Dock Bateria Ferramenta 18V (5.0Ah)',
            price: 890,
            autonomia: '17h a 25h+',
            group: 'controle',
            desc: 'Bateria comercial removível tipo Makita/DeWalt com troca em 5s e Step-Down na PCB.'
        },
        makita3ah: {
            title: 'Dock Bateria Ferramenta 18V (3.0Ah)',
            price: 690,
            autonomia: '9h a 12h',
            group: 'controle',
            desc: 'Variante compacta com troca em 5s.'
        },
        pack18650_12: {
            title: 'Pack Interno Selado 18650 (12.5Ah)',
            price: 400,
            autonomia: '17h a 25h+',
            group: 'controle',
            desc: 'Pack selado recarregável via USB-C na carcaça.'
        },
        pack18650_7: {
            title: 'Pack Interno Selado 18650 (7.5Ah)',
            price: 280,
            autonomia: '9h a 12h',
            group: 'controle',
            desc: 'Pack econômico com recarga via tomada USB-C.'
        },

        // PCB Master (Separada da Tela)
        pcb_top: {
            title: 'PCB Dupla Reforçada + Joysticks Hall Effect',
            price: 680,
            group: 'controle',
            desc: 'Placa de controle proprietária, Joysticks magnéticos de Efeito Hall (Zero Stick Drift), ESP32-WROOM-32U e Antena 5dBi.'
        },
        pcb_std: {
            title: 'PCB Dupla Padrão MVP',
            price: 395,
            group: 'controle',
            desc: 'Placa de controle proprietária com ESP32-WROOM-32U master, joysticks e 5 potenciômetros.'
        },

        // Carcaça
        hibrida: {
            title: 'Design Híbrido (Metal 1mm + Grip 3D)',
            price: 290,
            group: 'controle',
            desc: 'Chassi traseiro de aço/alumínio CNC 1mm + moldura frontal 3D.'
        },
        impressa3d: {
            title: 'Carenagem 100% Impressa em 3D',
            price: 230,
            group: 'controle',
            desc: 'Chassi em polímero modular leve.'
        },

        // Acabamento
        filme_policarbonato: {
            title: 'Filme de Máquina (Painel Adesivado Policarbonato)',
            price: 150,
            group: 'controle',
            desc: 'Película texturizada industrial com vedação frontal.'
        },
        sem_filme: {
            title: 'Carenagem Plástica Exposta',
            price: 0,
            group: 'controle',
            desc: 'Acabamento bruto para protótipo de bancada.'
        },

        // Tração Principal (Rodas)
        ac_trifasico: {
            title: '2x Motores AC Trifásicos WEG + Redutores + 2x Inversores CFW300',
            price: 6400,
            group: 'tracao',
            torque: '> 300 N.m (Massivo)',
            desc: 'Recomendada: Operação fria 24/7 ligada no 220V do aviário a 5 RPM via 2x Inversores WEG CFW300.'
        },
        tek8_dc: {
            title: 'Motoredutores TEK8 DC 24V (Dupla)',
            price: 5372,
            group: 'tracao',
            torque: '50 N.m (Inviável)',
            desc: 'Inviável: Apenas 25% da força necessária, gera atrito destrutivo.'
        },
        hub_bldc: {
            title: 'Hub Motor BLDC Direto (48V)',
            price: 4100,
            group: 'tracao',
            torque: '200 N.m',
            desc: 'Risco Extremo: Superaquecimento e derretimento a 5 RPM.'
        },

        // Drivers Ponte H (Molinetes 12V)
        ponteh_bts: {
            title: '4x Motores 12V DC (Tek8 MM04512) + Drivers Ponte H BTS7960 43A',
            price: 930,
            group: 'tracao',
            molinete: 'Tek8 12V + BTS7960 43A',
            desc: 'Módulos optoisolados com PWM e Reversão para desobstrução de aves.'
        },
        ponteh_dedicada: {
            title: '4x Motores 12V DC (Tek8 MM04512) + Placa Driver MOSFET Quadrupla Dedicada',
            price: 1330,
            group: 'tracao',
            molinete: 'Tek8 12V + PCB MOSFET Dedicated',
            desc: 'Placa industrial dedicada no painel com fusíveis térmicos e optoisolação.'
        },
        sem_molinetes: {
            title: 'Sem Acionamento de Molinetes 12V',
            price: 0,
            group: 'tracao',
            molinete: 'Desativado',
            desc: 'Sem acionamento de molinetes neste protótipo.'
        },

        // Protocolo
        modbus_tcp: {
            title: 'Modbus TCP/IP via Ethernet RJ45 (Nativo S7-1200)',
            price: 0,
            group: 'automacao',
            protocolo: 'Modbus TCP/IP (Ethernet)',
            desc: 'Utiliza a porta PROFINET nativa do CLP (Economia de ~US$ 150).'
        },
        modbus_rtu: {
            title: 'Modbus RTU via RS-485 Serial',
            price: 850,
            group: 'automacao',
            protocolo: 'RS-485 Modbus RTU',
            desc: 'Requer cartão de expansão Siemens CM 1241.'
        },

        // Sensores
        sensor_completo: {
            title: 'Kit Completo: Temp/Umidade SHT30 + Amônia (Winsen NH3)',
            price: 250,
            group: 'automacao',
            desc: 'Medição em tempo real de clima e gás amônia corrosivo.'
        },
        sensor_basico: {
            title: 'Sensor Temp/Umidade (Sensirion SHT30 I2C)',
            price: 60,
            group: 'automacao',
            desc: 'Medição climática básica.'
        },
        sem_sensores: {
            title: 'Sem Sensores Ambientais Extra',
            price: 0,
            group: 'automacao',
            desc: 'Leitura focada nos dados nativos do CLP.'
        }
    };

    // Format Currency Helper
    function formatMoney(amount) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    }

    // Update state and UI calculations
    function updateCalculations() {
        let priceControle = 0;
        let priceTracao = 0;
        let priceAutomacao = 0;

        // Sum prices
        priceControle += itemDetails[selections.display].price;
        priceControle += itemDetails[selections.bateria].price;
        priceControle += itemDetails[selections.pcb].price;
        priceControle += itemDetails[selections.carcaca].price;
        priceControle += itemDetails[selections.acabamento].price;

        priceTracao += itemDetails[selections.tracao].price;
        priceTracao += itemDetails[selections.ponteh].price;

        priceAutomacao += itemDetails[selections.protocolo].price;
        priceAutomacao += itemDetails[selections.sensores].price;

        const total = priceControle + priceTracao + priceAutomacao;

        // Update DOM elements
        document.getElementById('price-controle').textContent = formatMoney(priceControle);
        document.getElementById('price-tracao').textContent = formatMoney(priceTracao);
        document.getElementById('price-automacao').textContent = formatMoney(priceAutomacao);
        document.getElementById('price-total').textContent = formatMoney(total);
        document.getElementById('final-total-price').textContent = formatMoney(total);

        // Update Highlights Sidebar
        document.getElementById('sidebar-autonomia').textContent = itemDetails[selections.bateria].autonomia;
        document.getElementById('sidebar-display').textContent = itemDetails[selections.display].display;
        document.getElementById('sidebar-molinetes').textContent = itemDetails[selections.ponteh].molinete || 'N/A';
        document.getElementById('sidebar-protocolo').textContent = itemDetails[selections.protocolo].protocolo;
        document.getElementById('summary-autonomia').textContent = itemDetails[selections.bateria].autonomia;

        // Update Summary Lists in Tab 4
        renderSummaryLists();
    }

    function renderSummaryLists() {
        const controleUl = document.getElementById('summary-list-controle');
        const tracaoUl = document.getElementById('summary-list-tracao');
        const automacaoUl = document.getElementById('summary-list-automacao');

        controleUl.innerHTML = `
            <li>📺 <strong>Display HMI 7":</strong> ${itemDetails[selections.display].title} (${formatMoney(itemDetails[selections.display].price)})</li>
            <li>🔋 <strong>Alimentação:</strong> ${itemDetails[selections.bateria].title} (${formatMoney(itemDetails[selections.bateria].price)})</li>
            <li>⚙️ <strong>Placa PCB Master:</strong> ${itemDetails[selections.pcb].title} (${formatMoney(itemDetails[selections.pcb].price)})</li>
            <li>🛠️ <strong>Gabinete:</strong> ${itemDetails[selections.carcaca].title} (${formatMoney(itemDetails[selections.carcaca].price)})</li>
            <li>✨ <strong>Acabamento:</strong> ${itemDetails[selections.acabamento].title} (${formatMoney(itemDetails[selections.acabamento].price)})</li>
        `;

        tracaoUl.innerHTML = `
            <li>🚜 <strong>Tração das Rodas:</strong> ${itemDetails[selections.tracao].title}</li>
            <li>⚡ <strong>Inversores de Frequência:</strong> 2x WEG CFW300 (Controle de Frequência e Rampas Suaves)</li>
            <li>💪 <strong>Torque na Roda:</strong> ${itemDetails[selections.tracao].torque || 'N/A'}</li>
            <li>🔄 <strong>Molinetes 12V:</strong> ${itemDetails[selections.ponteh].title} (${formatMoney(itemDetails[selections.ponteh].price)})</li>
            <li>📋 <strong>Recursos Molinetes:</strong> Controle de velocidade PWM + Reversão de Sentido</li>
        `;

        automacaoUl.innerHTML = `
            <li>📡 <strong>Comunicação CLP:</strong> ${itemDetails[selections.protocolo].title}</li>
            <li>🧪 <strong>Sensores:</strong> ${itemDetails[selections.sensores].title} (${formatMoney(itemDetails[selections.sensores].price)})</li>
            <li>🔌 <strong>Interface:</strong> Ethernet RJ45 direta na CPU Siemens S7-1200</li>
        `;
    }

    // Card selection event listeners
    const configCards = document.querySelectorAll('.config-card');
    configCards.forEach(card => {
        card.addEventListener('click', () => {
            const radio = card.querySelector('input[type="radio"]');
            const groupName = card.dataset.group;
            const val = card.dataset.val;

            if (radio) {
                radio.checked = true;
            }

            // Remove selected class from siblings in same group
            document.querySelectorAll(`.config-card[data-group="${groupName}"]`).forEach(sibling => {
                sibling.classList.remove('selected');
            });

            // Add selected class to clicked card
            card.classList.add('selected');

            // Update selections state
            selections[groupName] = val;

            // Recalculate
            updateCalculations();
        });
    });

    // Tab Navigation Logic
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetTabId) {
        navTabs.forEach(tab => {
            if (tab.dataset.tab === targetTabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            if (content.id === targetTabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        window.scrollTo({ top: 300, behavior: 'smooth' });
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    // Next/Prev Buttons
    document.querySelectorAll('.next-tab-btn, .prev-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            if (target) {
                switchTab(target);
            }
        });
    });

    document.getElementById('goto-summary-btn').addEventListener('click', () => {
        switchTab('tab-resumo');
    });

    // Copy Summary Action
    document.getElementById('copy-summary-btn').addEventListener('click', () => {
        const totalText = document.getElementById('final-total-price').textContent;
        const textToCopy = `
==================================================
PROPOSTA TÉCNICA E COMERCIAL - FASE 1 (MVP COLHEITADEIRA AVÍCOLA)
Cliente: DNK | Elaborado por: DC Circuit Labs
==================================================
CUSTO TOTAL ESTIMADO DE HARDWARE: ${totalText}

1. CONTROLE REMOTO HMI 7":
   - Display: ${itemDetails[selections.display].title} (${formatMoney(itemDetails[selections.display].price)})
   - Bateria: ${itemDetails[selections.bateria].title} (Autonomia: ${itemDetails[selections.bateria].autonomia})
   - Eletrônica/PCB Master: ${itemDetails[selections.pcb].title} (${formatMoney(itemDetails[selections.pcb].price)})
   - Carcaça: ${itemDetails[selections.carcaca].title}
   - Acabamento: ${itemDetails[selections.acabamento].title}

2. TRAÇÃO & MOLINETES 12V:
   - Tração Principal: ${itemDetails[selections.tracao].title} (Torque: ${itemDetails[selections.tracao].torque})
   - Acionamento: 2x Inversores de Frequência WEG CFW300 (Obrigatórios)
   - Molinetes 12V + Ponte H: ${itemDetails[selections.ponteh].title}

3. AUTOMAÇÃO & CLP SIEMENS:
   - Protocolo: ${itemDetails[selections.protocolo].title}
   - Sensores: ${itemDetails[selections.sensores].title}

==================================================
METRICAS DE ACEITE (ANEXO 1):
- Alcance RF: 300m (ESP-NOW 5dBi)
- Latência: < 250ms
- Entrada Emergência: USB-C Power Path (Load Sharing) Native
==================================================
`;
        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            alert('Resumo da proposta copiado para a Área de Transferência com sucesso!');
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
        });
    });

    // Print Action
    document.getElementById('print-proposal-btn').addEventListener('click', () => {
        window.print();
    });

    // Initial calculation run
    updateCalculations();
});
