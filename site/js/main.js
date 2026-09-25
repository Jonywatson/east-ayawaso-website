// Gallery lightbox (links still open the full image when JavaScript is off)
const links = document.querySelectorAll('a[data-lightbox]');
if (links.length && 'HTMLDialogElement' in window) {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.innerHTML = '<button type="button" aria-label="Close">&times;</button><img alt=""><p></p>';
  document.body.append(dialog);
  const img = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  links.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    img.src = link.href;
    img.alt = link.querySelector('img')?.alt ?? '';
    caption.textContent = link.dataset.caption ?? '';
    dialog.showModal();
  }));
}

// Contact form: sends to the form service in the form's action attribute.
const form = document.querySelector('#contact-form');
if (form) {
  const status = document.querySelector('#form-status');
  const show = (kind, text) => {
    status.className = `form-status show ${kind}`;
    status.textContent = text;
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (form.action.includes('YOUR_FORM_ID')) {
      show('warn', 'Draft preview: the form is not connected yet, so this message was not sent. It will be connected once the office email is confirmed.');
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      show('ok', 'Thank you. Your message has been sent to the office, and we will respond as soon as we can.');
    } catch {
      show('err', 'Sorry, your message could not be sent. Please try again, or contact the office by phone.');
    } finally {
      button.disabled = false;
    }
  });
}

document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
