/**
 * Metabee - Sistema de Proteção por Senha da Documentação Metabee
 * Senha Autorizada: lNQtKLefX9u4Fs4Uvu4N
 */

(function () {
    const VALID_PASSWORD = "lNQtKLefX9u4Fs4Uvu4N";
    const AUTH_KEY = "metabee_authorized_session_key";

    // Ícones Lucide (https://lucide.dev) — licença ISC
    const ICONS = {
        'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
        'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />',
        'eye-off': '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />',
        'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />',
        'arrow-right': '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />'
    };
    function svg(name) {
        return '<svg class="ag-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
    }

    // Injeta os estilos CSS do Modal de Senha e do Botão de Logout
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'rogge-auth-styles';
        style.textContent = `
            .rogge-auth-blur {
                filter: blur(12px) opacity(0.15) !important;
                pointer-events: none !important;
                user-select: none !important;
                transition: filter 0.3s ease;
            }

            .rogge-auth-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(13, 17, 23, 0.94);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: roggeFadeIn 0.3s ease-out;
            }

            @keyframes roggeFadeIn {
                from { opacity: 0; transform: scale(0.97); }
                to { opacity: 1; transform: scale(1); }
            }

            .rogge-auth-card {
                background: #161b22;
                border: 1px solid rgba(0, 123, 255, 0.35);
                border-radius: 16px;
                padding: 40px 32px;
                max-width: 460px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 123, 255, 0.15);
                color: #ffffff;
                font-family: 'Montserrat', sans-serif;
            }

            .rogge-auth-icon {
                font-size: 2.8rem;
                margin-bottom: 12px;
                display: inline-block;
                animation: roggePulse 2s infinite ease-in-out;
            }

            @keyframes roggePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
            }

            .rogge-auth-badge {
                display: inline-block;
                background: rgba(0, 123, 255, 0.15);
                color: #007BFF;
                border: 1px solid rgba(0, 123, 255, 0.3);
                font-size: 0.75rem;
                font-weight: 700;
                padding: 4px 12px;
                border-radius: 20px;
                margin-bottom: 16px;
                letter-spacing: 0.5px;
            }

            .rogge-auth-card h2 {
                font-size: 1.5rem;
                font-weight: 800;
                margin-bottom: 10px;
                color: #ffffff;
            }

            .rogge-auth-card p {
                font-size: 0.88rem;
                color: #8b949e;
                line-height: 1.6;
                margin-bottom: 24px;
            }

            .rogge-input-wrapper {
                position: relative;
                margin-bottom: 16px;
            }

            .rogge-pass-input {
                width: 100%;
                background: #0d1117;
                border: 1px solid #30363d;
                border-radius: 8px;
                padding: 14px 44px 14px 16px;
                color: #ffffff;
                font-size: 0.95rem;
                font-family: 'Fira Code', monospace;
                outline: none;
                transition: all 0.25s;
            }

            .rogge-pass-input:focus {
                border-color: #007BFF;
                box-shadow: 0 0 12px rgba(0, 123, 255, 0.3);
            }

            .rogge-eye-btn {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #8b949e;
                cursor: pointer;
                font-size: 1.1rem;
                padding: 4px;
                transition: color 0.2s;
            }

            .rogge-eye-btn:hover { color: #007BFF; }

            .rogge-auth-error {
                display: none;
                background: rgba(248, 81, 73, 0.12);
                border: 1px solid rgba(248, 81, 73, 0.35);
                color: #ff7b72;
                font-size: 0.82rem;
                padding: 10px 14px;
                border-radius: 8px;
                margin-bottom: 16px;
                text-align: left;
                animation: roggeShake 0.4s ease-in-out;
            }

            @keyframes roggeShake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-6px); }
                40%, 80% { transform: translateX(6px); }
            }

            .rogge-auth-submit {
                width: 100%;
                background: linear-gradient(135deg, #007BFF 0%, #0056b3 100%);
                color: #ffffff;
                border: none;
                border-radius: 8px;
                padding: 14px;
                font-size: 0.95rem;
                font-weight: 700;
                font-family: 'Montserrat', sans-serif;
                cursor: pointer;
                transition: all 0.25s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .rogge-auth-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
            }

            .rogge-auth-footer {
                margin-top: 24px;
                font-size: 0.78rem;
                color: #484f58;
                font-weight: 600;
            }

            .rogge-logout-btn {
                background: rgba(248, 81, 73, 0.12);
                color: #ff7b72;
                border: 1px solid rgba(248, 81, 73, 0.3);
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.78rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Montserrat', sans-serif;
                margin-left: 10px;
            }

            .ag-i { width: 1em; height: 1em; vertical-align: -0.15em; flex-shrink: 0; }
            .rogge-auth-icon { display: block !important; line-height: 0; }
            .rogge-auth-icon .ag-i { width: 44px; height: 44px; color: #007BFF; }
            .rogge-eye-btn { display: flex; align-items: center; }
            .rogge-eye-btn .ag-i { width: 18px; height: 18px; }
            .rogge-logout-btn { display: inline-flex; align-items: center; gap: 6px; }

            .rogge-logout-btn:hover {
                background: #f85149;
                color: #ffffff;
                border-color: #f85149;
            }
        `;
        document.head.appendChild(style);
    }

    // Verifica se o usuário já possui autenticação válida
    function isAuthenticated() {
        return localStorage.getItem(AUTH_KEY) === VALID_PASSWORD;
    }

    // Exibe o modal de senha e bloqueia o conteúdo
    function lockPage() {
        // Aplica o efeito blur na tag main ou body
        const mainEl = document.querySelector('main') || document.body;
        if (mainEl) mainEl.classList.add('rogge-auth-blur');

        // Cria o modal de overlay caso ainda não exista
        if (!document.getElementById('rogge-auth-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'rogge-auth-overlay';
            overlay.className = 'rogge-auth-overlay';
            overlay.innerHTML = `
                <div class="rogge-auth-card">
                    <div class="rogge-auth-icon">${svg('lock')}</div>
                    <div class="rogge-auth-badge">METABEE — ÁREA RESTRITA</div>
                    <h2>Acesso Protegido por Senha</h2>
                    <p>Digite a chave de segurança para liberar o acesso à documentação técnica da Metabee (Wifi Connect V1.0).</p>
                    
                    <div class="rogge-input-wrapper">
                        <input type="password" id="rogge-pass-input" class="rogge-pass-input" placeholder="Digite a senha de acesso..." autocomplete="current-password">
                        <button type="button" class="rogge-eye-btn" id="rogge-eye-btn" title="Mostrar/Ocultar Senha">${svg('eye')}</button>
                    </div>
                    
                    <div id="rogge-auth-error" class="rogge-auth-error">
                        ${svg('triangle-alert')} <strong>Senha Incorreta!</strong> Verifique a credencial enviada pela DC Circuit Labs.
                    </div>
                    
                    <button type="button" id="rogge-submit-btn" class="rogge-auth-submit">
                        <span>Desbloquear Acesso Completo</span> ${svg('arrow-right')}
                    </button>
                    
                    <div class="rogge-auth-footer">DC Circuit Labs — Proteção de Dados de Engenharia</div>
                </div>
            `;
            document.body.appendChild(overlay);

            const input = document.getElementById('rogge-pass-input');
            const submitBtn = document.getElementById('rogge-submit-btn');
            const eyeBtn = document.getElementById('rogge-eye-btn');
            const errorBox = document.getElementById('rogge-auth-error');

            function handleAuthSubmit() {
                const enteredPass = input.value.trim();
                if (enteredPass === VALID_PASSWORD) {
                    localStorage.setItem(AUTH_KEY, VALID_PASSWORD);
                    unlockPage();
                } else {
                    errorBox.style.display = 'block';
                    input.value = '';
                    input.focus();
                    // Reinicia animação de shake
                    errorBox.style.animation = 'none';
                    setTimeout(() => errorBox.style.animation = 'roggeShake 0.4s ease-in-out', 10);
                }
            }

            submitBtn.addEventListener('click', handleAuthSubmit);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') handleAuthSubmit();
            });

            eyeBtn.addEventListener('click', function () {
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeBtn.innerHTML = svg('eye-off');
                } else {
                    input.type = 'password';
                    eyeBtn.innerHTML = svg('eye');
                }
            });

            setTimeout(() => input.focus(), 100);
        }
    }

    // Libera a página e remove o overlay
    function unlockPage() {
        const overlay = document.getElementById('rogge-auth-overlay');
        if (overlay) overlay.remove();

        const mainEl = document.querySelector('main') || document.body;
        if (mainEl) mainEl.classList.remove('rogge-auth-blur');

        // Adiciona o botão de Logout no Header
        attachLogoutButton();
    }

    // Injeta o botão de Logout na barra de navegação/header
    function attachLogoutButton() {
        if (document.getElementById('rogge-logout-btn')) return;

        const headerRight = document.querySelector('.client-tag') || document.querySelector('.header-container');
        if (headerRight) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'rogge-logout-btn';
            logoutBtn.className = 'rogge-logout-btn';
            logoutBtn.innerHTML = svg('lock') + ' Bloquear';
            logoutBtn.title = 'Encerrar sessão protegida por senha';
            logoutBtn.onclick = function () {
                localStorage.removeItem(AUTH_KEY);
                window.location.reload();
            };
            headerRight.parentNode.insertBefore(logoutBtn, headerRight.nextSibling);
        }
    }

    // Executa a checagem no carregamento da página
    function initAuthGuard() {
        injectStyles();
        if (isAuthenticated()) {
            unlockPage();
        } else {
            lockPage();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthGuard);
    } else {
        initAuthGuard();
    }

    // Exporta objeto global caso necessário
    window.MetabeeAuth = {
        logout: function () {
            localStorage.removeItem(AUTH_KEY);
            window.location.reload();
        }
    };
})();
