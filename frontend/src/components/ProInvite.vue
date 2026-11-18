<template>
  <GaNote v-if="show" tone="info" icon="trending-up">
    Olhando para trás? O Pro compara seus meses lado a lado e mostra para onde o gasto foi, por
    categoria.
    <button type="button" class="invite__link" @click="goToPlans">Ver o que o Pro abre</button>
  </GaNote>
</template>

<script setup>
/**
 * Convite ao Pro no instante em que ele faz sentido (ROADMAP 2.5).
 *
 * MOTIVO: o usuário do plano grátis nunca esbarra no limite. Ele usa feliz por
 * meses e nunca sente falta de nada, porque para sentir falta precisaria
 * abrir, por conta própria, uma tela que ele não sabe para que serve. Sem
 * encontro com o limite não existe conversão — e o problema não é o preço, é
 * que a oferta nunca chega.
 *
 * ── Por que o gatilho é navegar para um mês passado ───────────────────
 *
 * Porque é INTENÇÃO demonstrada, não dado acumulado. Contar meses de
 * histórico diria que a pessoa PODERIA se interessar; voltar um mês diz que
 * ela está olhando para trás agora. É a diferença entre oferecer guarda-chuva
 * a quem mora em cidade chuvosa e oferecer a quem está na porta vendo chover.
 *
 * E tem um efeito colateral bom: não precisa de endpoint nenhum. O estado já
 * está na tela.
 *
 * ── Quem NÃO vê ──────────────────────────────────────────────────────
 *
 * Quem assina, obviamente. E quem está na cortesia de antes do paywall: essas
 * pessoas já recebem o aviso próprio na tela de planos, e repetir a oferta
 * aqui seria cobrar duas vezes de quem ainda nem foi cobrado uma.
 */
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import GaNote from "@/design-system/components/GaNote.vue";
import { getTransactions } from "@/services/api";
import { useSubscription } from "../stores/subscription";
import { trackEvent } from "../services/analytics";

const props = defineProps({
  /** Ano e mês que a tela está exibindo. */
  year: { type: Number, required: true },
  month: { type: Number, required: true },
});

const router = useRouter();
const { hasPaidAccess, grandfatheredUntil, paywallEnabled, load } = useSubscription();

// O estado da assinatura precisa estar carregado antes de decidir convidar.
onMounted(() => load().catch(() => {}));

/**
 * O mês corrente em UTC, igual ao que `useMonthNavigation` usa.
 *
 * Em fuso local, a virada do mês deixaria os dois lados discordando por
 * algumas horas e o convite apareceria no próprio mês atual — exatamente
 * quando ele não tem nada a dizer.
 */
const isPastMonth = computed(() => {
  const agora = new Date();
  const atual = agora.getUTCFullYear() * 12 + agora.getUTCMonth();
  const vendo = props.year * 12 + (props.month - 1);

  return vendo < atual;
});

/** O mes visitado tem algo lancado? Sem isso nao ha o que comparar. */
const mesTemDados = ref(false);

/**
 * Quem ainda nao lancou nada nao tem passado para olhar.
 *
 * Sem esta checagem, uma conta recem-criada recebia ao mesmo tempo o guia de
 * primeiro uso ("comece por aqui") e o convite ao Pro ("olhando para tras?") —
 * dois avisos que se contradizem na mesma tela. `limit: 1` responde a pergunta
 * com a consulta mais barata que existe.
 */
async function conferirMes() {
  if (!podeConvidar.value) {
    mesTemDados.value = false;
    return;
  }

  try {
    const lista = await getTransactions({ year: props.year, month: props.month, limit: 1 });
    mesTemDados.value = Array.isArray(lista) && lista.length > 0;
  } catch {
    // Convite e acessorio: falha de rede nao vira erro na tela de ninguem.
    mesTemDados.value = false;
  }
}

/**
 * Com o paywall DESLIGADO ninguem e convidado: os recursos estao abertos
 * para todos, e oferecer o que a pessoa ja tem soa a desatencao.
 */
const podeConvidar = computed(
  () =>
    paywallEnabled.value &&
    isPastMonth.value &&
    !hasPaidAccess.value &&
    !grandfatheredUntil.value
);

const show = computed(() => podeConvidar.value && mesTemDados.value);

watch([() => props.year, () => props.month, podeConvidar], conferirMes, { immediate: true });

/**
 * O evento sai quando o convite APARECE, não quando a tela monta: o
 * componente vive montado o tempo todo e só se revela ao voltar um mês. Medir
 * a montagem contaria como oferta vista algo que ninguém viu.
 */
watch(show, (visivel) => {
  if (visivel) trackEvent("convite_pro_visto", { origem: "mes_anterior" });
});

function goToPlans() {
  trackEvent("convite_pro_clicado", { origem: "mes_anterior" });
  router.push("/plans");
}
</script>

<style scoped>
/* Botão com cara de link: a ação é secundária, não deve competir com o
   conteúdo do mês que a pessoa veio ver. */
.invite__link {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--text-link);
  text-decoration: underline;
  cursor: pointer;
}

.invite__link:focus-visible {
  outline: none;
  box-shadow: var(--ring-focus);
  border-radius: var(--radius-xs);
}
</style>
