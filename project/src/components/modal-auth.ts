// src/components/modal-auth.ts

import { el } from 'redom';
import { Store } from '../services/store';

export class ModalAuth {
  el: HTMLElement;
  private store = Store.getInstance();

  private loginSubmitBtn: HTMLButtonElement | null = null;
  private registerSubmitBtn: HTMLButtonElement | null = null;

  private loginFormEl: HTMLFormElement | null = null;
  private registerFormEl: HTMLFormElement | null = null;

  private loginUsernameInput: HTMLInputElement | null = null;
  private loginPasswordInput: HTMLInputElement | null = null;

  private registerUsernameInput: HTMLInputElement | null = null;
  private registerPasswordInput: HTMLInputElement | null = null;

  private loginSubmitting = false;
  private registerSubmitting = false;

  private readonly registerUsernameName = `u_${Math.random().toString(36).slice(2, 12)}`;
  private readonly registerPasswordName = `p_${Math.random().toString(36).slice(2, 12)}`;

  private readonly registerUsernameId = `reg-user-${Math.random().toString(36).slice(2, 12)}`;
  private readonly registerPasswordId = `reg-pass-${Math.random().toString(36).slice(2, 12)}`;

  constructor() {
    const loginRadio = el('input.modal-auth__radio', {
      type: 'radio',
      name: 'auth-mode',
      id: 'auth-login',
      checked: true
    });

    const registerRadio = el('input.modal-auth__radio', {
      type: 'radio',
      name: 'auth-mode',
      id: 'auth-register'
    });

    const closeIcon = el('img', {
      src: 'images/x-account.svg',
      alt: 'закрыть',
      width: 24,
      height: 24
    }) as HTMLImageElement;

    const modalContent = el('div.modal-auth__content', [
      el('div.modal-auth__logo', [
        el('div.modal-auth__logo-icon', el('img', { src: 'images/arrow-right.svg', alt: 'стрелка' })),
        el('span.modal-auth__logo-text', 'VibeCast Studio')
      ]),
      el('label.modal-auth__close-button', { for: 'modal-toggle', 'aria-label': 'Закрыть' }, closeIcon),
      this.createLoginForm(),
      this.createRegisterForm()
    ]);

    this.el = el('div.modal-auth__overlay', [loginRadio, registerRadio, modalContent]);
  }

  private isValidCredentials(username: string, password: string) {
    return username.trim().length >= 3 && password.length >= 3;
  }

  private setLoginLoading(isLoading: boolean) {
    if (!this.loginSubmitBtn) return;
    this.loginSubmitBtn.disabled = isLoading;
    this.loginSubmitBtn.textContent = isLoading ? 'Вход...' : 'Войти';
  }

  private setRegisterLoading(isLoading: boolean) {
    if (!this.registerSubmitBtn) return;
    this.registerSubmitBtn.disabled = isLoading;
    this.registerSubmitBtn.textContent = isLoading ? 'Создание...' : 'Создать аккаунт';
  }

  private forceClearInput(input: HTMLInputElement | null) {
    if (!input) return;
    input.value = '';
    input.defaultValue = '';
    input.setAttribute('value', '');
    input.blur();
  }

  private clearLoginFields() {
    if (this.loginFormEl) this.loginFormEl.reset();
    this.forceClearInput(this.loginUsernameInput);
    this.forceClearInput(this.loginPasswordInput);
  }

  private clearRegisterFields() {
    if (this.registerFormEl) this.registerFormEl.reset();
    this.forceClearInput(this.registerUsernameInput);
    this.forceClearInput(this.registerPasswordInput);
  }

  private unlockRegisterField(input: HTMLInputElement) {
    input.removeAttribute('readonly');
  }

  private createLoginForm() {
    this.loginUsernameInput = el('input.modal-auth__input', {
      type: 'text',
      id: 'login-username',
      name: 'login-username',
      placeholder: 'Имя пользователя',
      autocomplete: 'username',
      spellcheck: false
    }) as HTMLInputElement;

    this.loginPasswordInput = el('input.modal-auth__input', {
      type: 'password',
      id: 'login-password',
      name: 'login-password',
      placeholder: 'Пароль',
      autocomplete: 'current-password'
    }) as HTMLInputElement;

    this.loginSubmitBtn = el('button.modal-auth__submit', { type: 'submit' }, 'Войти') as HTMLButtonElement;

    this.loginFormEl = el('form.modal-auth__form.modal-auth__form--login', {
      autocomplete: 'on',
      onsubmit: async (e: Event) => {
        e.preventDefault();
        if (this.loginSubmitting) return;
        await this.handleLogin();
      }
    }, [
      el('div.modal-auth__input-wrapper',
        el('div.modal-auth__input-container', [
          el('div.modal-auth__input-icon',
            el('img', { src: 'images/user-account.svg', alt: '', width: 20, height: 20 })
          ),
          this.loginUsernameInput
        ])
      ),
      el('div.modal-auth__input-wrapper',
        el('div.modal-auth__input-container', [
          el('div.modal-auth__input-icon',
            el('img', { src: 'images/lock.svg', alt: '', width: 20, height: 20 })
          ),
          this.loginPasswordInput
        ])
      ),
      this.loginSubmitBtn
    ]) as HTMLFormElement;

    const switchBtn = el('label.modal-auth__switch', { for: 'auth-register' }, 'Регистрация');
    return el('div.modal-auth__form.modal-auth__form--login', [el('h2.modal-auth__title', 'Вход'), this.loginFormEl, switchBtn]);
  }

  private createRegisterForm() {
    this.registerUsernameInput = el('input.modal-auth__input', {
      type: 'text',
      id: this.registerUsernameId,
      name: this.registerUsernameName,
      placeholder: 'Имя пользователя',
      autocomplete: 'new-password',
      spellcheck: false,
      autocapitalize: 'off',
      autocorrect: 'off',
      readonly: true,
      onpointerdown: (e: Event) => {
        this.unlockRegisterField(e.currentTarget as HTMLInputElement);
      },
      onfocus: (e: Event) => {
        this.unlockRegisterField(e.currentTarget as HTMLInputElement);
      },
      onkeydown: (e: Event) => {
        this.unlockRegisterField(e.currentTarget as HTMLInputElement);
      }
    }) as HTMLInputElement;

    this.registerPasswordInput = el('input.modal-auth__input', {
      type: 'password',
      id: this.registerPasswordId,
      name: this.registerPasswordName,
      placeholder: 'Пароль',
      autocomplete: 'new-password',
      readonly: true,
      onpointerdown: (e: Event) => {
        this.unlockRegisterField(e.currentTarget as HTMLInputElement);
      },
      onfocus: (e: Event) => {
        this.unlockRegisterField(e.currentTarget as HTMLInputElement);
      },
      onkeydown: (e: Event) => {
        this.unlockRegisterField(e.currentTarget as HTMLInputElement);
      }
    }) as HTMLInputElement;

    this.registerSubmitBtn = el('button.modal-auth__submit', { type: 'submit' }, 'Создать аккаунт') as HTMLButtonElement;

    this.registerFormEl = el('form.modal-auth__form.modal-auth__form--register', {
      autocomplete: 'off',
      novalidate: true,
      onsubmit: async (e: Event) => {
        e.preventDefault();
        if (this.registerSubmitting) return;
        await this.handleRegister();
      }
    }, [
      el('div.modal-auth__input-wrapper',
        el('div.modal-auth__input-container', [
          el('div.modal-auth__input-icon',
            el('img', { src: 'images/user-account.svg', alt: '', width: 20, height: 20 })
          ),
          this.registerUsernameInput
        ])
      ),
      el('div.modal-auth__input-wrapper',
        el('div.modal-auth__input-container', [
          el('div.modal-auth__input-icon',
            el('img', { src: 'images/lock.svg', alt: '', width: 20, height: 20 })
          ),
          this.registerPasswordInput
        ])
      ),
      this.registerSubmitBtn
    ]) as HTMLFormElement;

    const switchBtn = el('label.modal-auth__switch', { for: 'auth-login' }, 'У меня есть пароль');
    return el('div.modal-auth__form.modal-auth__form--register', [el('h2.modal-auth__title', 'Регистрация'), this.registerFormEl, switchBtn]);
  }

  private async handleLogin() {
    const username = this.loginUsernameInput?.value.trim() || '';
    const password = this.loginPasswordInput?.value || '';

    if (!this.isValidCredentials(username, password)) {
      alert('Введите корректные имя пользователя и пароль');
      return;
    }

    this.loginSubmitting = true;
    this.setLoginLoading(true);

    try {
      await this.store.login(username, password);
      this.clearLoginFields();

      const modalToggle = document.getElementById('modal-toggle') as HTMLInputElement | null;
      if (modalToggle) modalToggle.checked = false;

      alert('Вход выполнен');
    } catch {
      alert('Ошибка входа');
    } finally {
      this.loginSubmitting = false;
      this.setLoginLoading(false);
    }
  }

  private async handleRegister() {
    const username = this.registerUsernameInput?.value.trim() || '';
    const password = this.registerPasswordInput?.value || '';

    if (!this.isValidCredentials(username, password)) {
      alert('Заполните корректные имя пользователя и пароль');
      return;
    }

    this.registerSubmitting = true;
    this.setRegisterLoading(true);

    try {
      await this.store.register(username, password);
      this.clearRegisterFields();

      // Автоподстановка имени в форму входа
      if (this.loginUsernameInput) {
        this.loginUsernameInput.value = username;
      }

      alert('Регистрация успешна, теперь войдите');

      const authLogin = document.getElementById('auth-login') as HTMLInputElement | null;
      if (authLogin) authLogin.checked = true;
    } catch {
      alert('Ошибка регистрации');
    } finally {
      this.registerSubmitting = false;
      this.setRegisterLoading(false);
    }
  }
}