// Formata o CNPJ enquanto o cliente digita: 00.000.000/0000-00
export function mascararCnpj() {
  document.querySelectorAll<HTMLInputElement>('[data-mascara-cnpj]').forEach((campo) => {
    const formatar = () => {
      const d = campo.value.replace(/\D/g, '').slice(0, 14);
      const partes = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12), d.slice(12, 14)];
      let v = partes[0];
      if (partes[1]) v += '.' + partes[1];
      if (partes[2]) v += '.' + partes[2];
      if (partes[3]) v += '/' + partes[3];
      if (partes[4]) v += '-' + partes[4];
      campo.value = v;
    };
    campo.addEventListener('input', formatar);
    formatar();
  });
}
