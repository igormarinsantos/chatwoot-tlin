<script>
// utils and composables
import { login } from '../../api/auth';
import { mapGetters } from 'vuex';
import { useAlert } from 'dashboard/composables';
import { required, email } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { SESSION_STORAGE_KEYS } from 'dashboard/constants/sessionStorage';
import SessionStorage from 'shared/helpers/sessionStorage';
import { useBranding } from 'shared/composables/useBranding';

// components
import SimpleDivider from '../../components/Divider/SimpleDivider.vue';
import FormInput from '../../components/Form/Input.vue';
import GoogleOAuthButton from '../../components/GoogleOauth/Button.vue';
import Spinner from 'shared/components/Spinner.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import NextButton from 'dashboard/components-next/button/Button.vue';
import MfaVerification from 'dashboard/components/auth/MfaVerification.vue';

const ERROR_MESSAGES = {
  'no-account-found': 'LOGIN.OAUTH.NO_ACCOUNT_FOUND',
  'business-account-only': 'LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY',
  'saml-authentication-failed': 'LOGIN.SAML.API.ERROR_MESSAGE',
  'saml-not-enabled': 'LOGIN.SAML.API.ERROR_MESSAGE',
};

const IMPERSONATION_URL_SEARCH_KEY = 'impersonation';

export default {
  components: {
    FormInput,
    GoogleOAuthButton,
    Spinner,
    NextButton,
    SimpleDivider,
    MfaVerification,
    Icon,
  },
  props: {
    ssoAuthToken: { type: String, default: '' },
    ssoAccountId: { type: String, default: '' },
    ssoConversationId: { type: String, default: '' },
    email: { type: String, default: '' },
    authError: { type: String, default: '' },
  },
  setup() {
    const { replaceInstallationName } = useBranding();
    return {
      replaceInstallationName,
      v$: useVuelidate(),
    };
  },
  data() {
    return {
      // We need to initialize the component with any
      // properties that will be used in it
      credentials: {
        email: '',
        password: '',
      },
      loginApi: {
        message: '',
        showLoading: false,
        hasErrored: false,
      },
      error: '',
      mfaRequired: false,
      mfaToken: null,
    };
  },
  validations() {
    return {
      credentials: {
        password: {
          required,
        },
        email: {
          required,
          email,
        },
      },
    };
  },
  computed: {
    ...mapGetters({ globalConfig: 'globalConfig/get' }),
    allowedLoginMethods() {
      return window.chatwootConfig.allowedLoginMethods || ['email'];
    },
    showGoogleOAuth() {
      return (
        this.allowedLoginMethods.includes('google_oauth') &&
        Boolean(window.chatwootConfig.googleOAuthClientId)
      );
    },
    showSignupLink() {
      return window.chatwootConfig.signupEnabled === 'true';
    },
    showSamlLogin() {
      return this.allowedLoginMethods.includes('saml');
    },
  },
  created() {
    if (this.ssoAuthToken) {
      this.submitLogin();
    }
    if (this.authError) {
      const messageKey = ERROR_MESSAGES[this.authError] ?? 'LOGIN.API.UNAUTH';
      // Use a method to get the translated text to avoid dynamic key warning
      const translatedMessage = this.getTranslatedMessage(messageKey);
      useAlert(translatedMessage);
      // wait for idle state
      this.requestIdleCallbackPolyfill(() => {
        // Remove the error query param from the url
        const { query } = this.$route;
        this.$router.replace({ query: { ...query, error: undefined } });
      });
    }
  },
  methods: {
    getTranslatedMessage(key) {
      // Avoid dynamic key warning by handling each case explicitly
      switch (key) {
        case 'LOGIN.OAUTH.NO_ACCOUNT_FOUND':
          return this.$t('LOGIN.OAUTH.NO_ACCOUNT_FOUND');
        case 'LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY':
          return this.$t('LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY');
        case 'LOGIN.API.UNAUTH':
        default:
          return this.$t('LOGIN.API.UNAUTH');
      }
    },
    // TODO: Remove this when Safari gets wider support
    // Ref: https://caniuse.com/requestidlecallback
    //
    requestIdleCallbackPolyfill(callback) {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(callback);
      } else {
        // Fallback for safari
        // Using a delay of 0 allows the callback to be executed asynchronously
        // in the next available event loop iteration, similar to requestIdleCallback
        setTimeout(callback, 0);
      }
    },
    showAlertMessage(message) {
      // Reset loading, current selected agent
      this.loginApi.showLoading = false;
      this.loginApi.message = message;
      useAlert(this.loginApi.message);
    },
    handleImpersonation() {
      // Detects impersonation mode via URL and sets a session flag to prevent user settings changes during impersonation.
      const urlParams = new URLSearchParams(window.location.search);
      const impersonation = urlParams.get(IMPERSONATION_URL_SEARCH_KEY);
      if (impersonation) {
        SessionStorage.set(SESSION_STORAGE_KEYS.IMPERSONATION_USER, true);
      }
    },
    submitLogin() {
      this.loginApi.hasErrored = false;
      this.loginApi.showLoading = true;

      const credentials = {
        email: this.email
          ? decodeURIComponent(this.email)
          : this.credentials.email,
        password: this.credentials.password,
        sso_auth_token: this.ssoAuthToken,
        ssoAccountId: this.ssoAccountId,
        ssoConversationId: this.ssoConversationId,
      };

      login(credentials)
        .then(result => {
          // Check if MFA is required
          if (result?.mfaRequired) {
            this.loginApi.showLoading = false;
            this.mfaRequired = true;
            this.mfaToken = result.mfaToken;
            return;
          }

          this.handleImpersonation();
          this.showAlertMessage(this.$t('LOGIN.API.SUCCESS_MESSAGE'));
        })
        .catch(response => {
          // Reset URL Params if the authentication is invalid
          if (this.email) {
            window.location = '/app/login';
          }
          this.loginApi.hasErrored = true;
          this.showAlertMessage(
            response?.message || this.$t('LOGIN.API.UNAUTH')
          );
        });
    },
    submitFormLogin() {
      if (this.v$.credentials.email.$invalid && !this.email) {
        this.showAlertMessage(this.$t('LOGIN.EMAIL.ERROR'));
        return;
      }

      this.submitLogin();
    },
    handleMfaVerified() {
      // MFA verification successful, continue with login
      this.handleImpersonation();
      window.location = '/app';
    },
    handleMfaCancel() {
      // User cancelled MFA, reset state
      this.mfaRequired = false;
      this.mfaToken = null;
      this.credentials.password = '';
    },
  },
};
</script>

<template>
  <main class="flex min-h-screen w-full bg-white overflow-hidden font-body">
    <!-- Left Column: Marketing / Branding (Hidden on Mobile) -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-n-slate-2 overflow-hidden flex-col p-16 justify-between tlin-grid-bg">
      <div class="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#B597FF]/10 rounded-full blur-[120px] animate-blob" />
      <div class="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#38E3FF]/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      
      <div class="relative z-10">
        <div class="flex items-center mb-12 md:mb-16 justify-center lg:justify-start">
          <img :src="globalConfig.logo" :alt="globalConfig.installationName" class="h-10 w-auto" />
        </div>

        <div class="mb-8">
          <div class="inline-flex items-center justify-center p-2 rounded-xl bg-n-brand/10 mb-6 group">
            <Icon icon="i-lucide-trending-up" class="size-6 text-n-brand group-hover:scale-110 transition-transform" />
          </div>
          <h1 class="text-5xl font-bold text-n-slate-12 leading-[1.1] tracking-tight mb-6">
            Aumente seu <span class="text-gradient-tlin">ROI</span> em até 3x e <span class="text-gradient-tlin">reduza custos operacionais</span>.
          </h1>
          <p class="text-lg text-n-slate-10 max-w-lg leading-relaxed">
            Transforme cada lead de WhatsApp em agendamento real com nossa IA de alta conversão. Atendimento imediato que não deixa dinheiro na mesa.
          </p>
        </div>

        <div class="space-y-6 max-w-lg mx-auto lg:mx-0">
        <div class="bg-white/80 dark:bg-n-solid-2 backdrop-blur-md p-6 rounded-3xl border border-n-weak shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-2xl bg-n-brand/10 flex items-center justify-center">
              <span class="i-lucide-check-circle-2 size-6 text-n-brand" />
            </div>
            <div>
              <h3 class="font-bold text-n-slate-12">Conversão Imbatível</h3>
              <p class="text-sm text-n-slate-10">IA treinada para fechar agendamentos e aumentar seu faturamento.</p>
            </div>
          </div>
        </div>

        <div class="bg-white/80 dark:bg-n-solid-2 backdrop-blur-md p-6 rounded-3xl border border-n-weak shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-2xl bg-n-brand/10 flex items-center justify-center">
              <span class="i-lucide-shrimp size-6 text-n-brand" />
            </div>
            <div>
              <h3 class="font-bold text-n-slate-12">Redução de Custos</h3>
              <p class="text-sm text-n-slate-10">Diminua sua carga operacional enquanto escala seu atendimento 24/7.</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div class="relative z-10 text-xs text-n-slate-9 mt-12">
        © {{ new Date().getFullYear() }} Tlin.ai. Todos os direitos reservados.
      </div>
    </div>

    <!-- Right Column: Login Form -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-16 relative bg-white">
      <!-- Mobile Logo -->
      <div class="lg:hidden absolute top-8 w-full left-0 flex justify-center">
        <img :src="globalConfig.logo" :alt="globalConfig.installationName" class="h-8 w-auto" />
      </div>

      <div class="w-full max-w-md">
        <div class="mb-8 text-center lg:text-left">
          <h1 class="text-3xl font-bold text-n-slate-12 mb-2">
            Bem-vindo ao Futuro
          </h1>
          <p class="text-n-slate-10 mb-8">
            Acesse sua central de inteligência e gerencie sua clínica com
            tecnologia de elite.
          </p>
        </div>

        <!-- MFA Verification Section -->
        <section v-if="mfaRequired">
          <MfaVerification
            :mfa-token="mfaToken"
            @verified="handleMfaVerified"
            @cancel="handleMfaCancel"
          />
        </section>

        <!-- Regular Login Section -->
        <section v-else>
          <div v-if="!email">
            <div v-if="showGoogleOAuth || showSamlLogin" class="flex flex-col gap-4 mb-8">
              <GoogleOAuthButton v-if="showGoogleOAuth" />
              <div v-if="showSamlLogin">
                <router-link
                  to="/app/login/sso"
                  class="inline-flex justify-center w-full px-4 py-3 items-center bg-n-background rounded-md shadow-sm ring-1 ring-inset ring-n-container focus:outline-offset-0 hover:bg-n-alpha-2"
                >
                  <Icon icon="i-lucide-lock-keyhole" class="size-5 text-n-slate-11" />
                  <span class="ml-2 text-base font-medium text-n-slate-12">
                    {{ $t('LOGIN.SAML.LABEL') }}
                  </span>
                </router-link>
              </div>
              <SimpleDivider :label="$t('COMMON.OR')" class="uppercase" />
            </div>

            <form class="space-y-6" @submit.prevent="submitFormLogin">
              <div class="space-y-1">
                <label for="email" class="text-sm font-bold text-n-slate-12 block ml-1 text-center lg:text-left">E-mail Profissional</label>
                <FormInput
                  v-model="credentials.email"
                  name="email_address"
                  type="text"
                  icon="i-lucide-mail"
                  data-testid="email_input"
                  :tabindex="1"
                  required
                  label=""
                  placeholder="exemplo@clinica.com.br"
                  :has-error="v$.credentials.email.$error"
                  @input="v$.credentials.email.$touch"
                />
              </div>

              <div class="space-y-1">
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-end mb-1 px-1">
                  <label for="password" class="text-sm font-bold text-n-slate-12 text-center lg:text-left">Senha</label>
                  <router-link to="auth/reset/password" class="text-xs font-medium text-n-brand hover:underline text-center lg:text-right mt-1 lg:mt-0">
                    Esqueci minha senha
                  </router-link>
                </div>
                <FormInput
                  v-model="credentials.password"
                  type="password"
                  name="password"
                  icon="i-lucide-shield-lock"
                  data-testid="password_input"
                  required
                  :tabindex="2"
                  label=""
                  placeholder="••••••••"
                  :has-error="v$.credentials.password.$error"
                  @input="v$.credentials.password.$touch"
                />
              </div>

              <div class="flex items-center gap-2 px-1 justify-center lg:justify-start">
                <input type="checkbox" id="remember" class="size-4 accent-n-brand rounded border-n-weak" />
                <label for="remember" class="text-sm text-n-slate-10 select-none">Lembrar de mim</label>
              </div>

              <NextButton
                lg
                type="submit"
                data-testid="submit_button"
                class="w-full !rounded-2xl !py-4 shadow-lg shadow-n-brand/20 active:scale-95 transition-all text-base font-bold bubble-gradient"
                :tabindex="3"
                label="Acessar minha Central de IA"
                :disabled="loginApi.showLoading"
                :is-loading="loginApi.showLoading"
              />
            </form>


            <div class="mt-8 text-center">
              <p class="text-sm text-n-slate-11">
                Ainda não tem conta? 
                <button class="text-n-brand font-bold hover:underline transition-all">
                  Solicite uma demonstração exclusiva →
                </button>
              </p>
            </div>
          </div>
          <div v-else class="flex items-center justify-center p-12">
            <Spinner color-scheme="primary" />
          </div>
        </section>

        <footer class="mt-16 pt-8 border-t border-n-weak flex flex-col items-center gap-4 text-[10px] text-n-slate-8 uppercase tracking-widest font-bold">
          <div class="flex gap-6">
            <div class="flex items-center gap-1.5 grayscale opacity-60">
              <Icon icon="i-lucide-check-shield" class="size-3" />
              LGPD COMPLIANCE
            </div>
            <div class="flex items-center gap-1.5 grayscale opacity-60">
              <Icon icon="i-lucide-lock" class="size-3" />
              SSL SECURE
            </div>
          </div>
          <div class="text-center lowercase font-medium">
            © {{ new Date().getFullYear() }} Tlin.ai. Sua segurança é nossa prioridade.<br/>
            Dados protegidos conforme as diretrizes da LGPD.
          </div>
        </footer>
      </div>
    </div>
  </main>
</template>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}
</style>
