// Espera o documento carregar completamente
document.addEventListener('DOMContentLoaded', () => {

    // 1. Navegação Sticky (Muda de cor ao rolar)
    const header = document.getElementById('main-header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Menu Mobile (Burger)
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');

        // Burger Animation
        burger.classList.toggle('toggle');
    });

    // Fecha o menu mobile ao clicar em um link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
        });
    });


    // 3. Animação de "Reveal" ao rolar a página
    // Seleciona todos os elementos com classes de reveal
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up');

    function checkReveal() {
        const triggerBottom = window.innerHeight * 0.85; // Ponto de gatilho a 85% da altura da tela

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;

            if (elementTop < triggerBottom) {
                element.classList.add('active');
            } else {
                // Opcional: remove a classe se rolar para cima de volta
                // element.classList.remove('active'); 
            }
        });
    }

    // Verifica a posição inicial
    checkReveal();
    // Verifica a cada rolagem
    window.addEventListener('scroll', checkReveal);
});