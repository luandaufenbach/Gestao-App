<script setup>
/**
 * Política de privacidade (ROADMAP 0.7).
 *
 * O texto foi escrito LENDO O CÓDIGO, não a partir de modelo genérico. Cada
 * afirmação daqui tem origem rastreável:
 *
 *   - dados de conta ........ backend/src/models/User.js
 *   - dados financeiros ..... backend/src/models/Transaction.js, Goal.js,
 *                             Category.js, BankCard.js
 *   - exportar e excluir .... backend/src/controllers/accountController.js,
 *                             backend/src/routes/account.js,
 *                             frontend/src/views/Account.vue
 *   - tokens e validades .... PASSWORD_RESET_TTL_MS (1h) e
 *                             EMAIL_VERIFICATION_TTL_MS (24h) em User.js
 *   - sessão de 7 dias ...... jwtExpiresIn em backend/src/config/env.js
 *   - token no navegador .... tokenStorage em frontend/src/services/http.js
 *   - limites por IP ........ backend/src/app.js, routes/auth.js,
 *                             routes/account.js
 *   - monitoramento ......... backend/src/config/monitoring.js
 *   - medição de uso ........ frontend/src/services/analytics.js
 *   - hospedagem ............ render.yaml (API e site no Render; banco no Atlas)
 *
 * ATENÇÃO AO ALTERAR O SISTEMA: se um destes pontos mudar — provedor novo,
 * campo novo no modelo, retenção diferente — este arquivo passa a MENTIR, e
 * uma política de privacidade que mente é um problema jurídico, não um texto
 * desatualizado. Trate-o como parte do contrato do código.
 * */
import LegalShell from "../components/LegalShell.vue";
</script>

<template>
  <LegalShell
    title="Política de privacidade"
    counterpart-to="/terms"
    counterpart-label="Ler também os Termos de uso"
  >
    <h2>Em resumo</h2>
    <p>
      O Gestão App guarda o que você digita sobre o seu dinheiro: lançamentos, categorias, metas e
      os cartões que você cadastra. Usamos esses dados para uma coisa só — mostrar a você as suas
      próprias contas organizadas. <strong>Não vendemos seus dados</strong>, não exibimos anúncios
      dentro do app, não compartilhamos nada com anunciante nenhum e não nos conectamos ao seu
      banco.
    </p>
    <p>
      Você pode <strong>baixar tudo o que é seu</strong> em um arquivo e
      <strong>apagar a conta inteira</strong> a qualquer momento, sozinho, pela tela
      <strong>Minha conta</strong> — sem pedir autorização a ninguém e sem abrir chamado.
    </p>

    <h2>Quem é o responsável pelos seus dados</h2>
    <p>
      O responsável pelo tratamento dos seus dados pessoais (o
      <strong>controlador</strong>, no vocabulário da Lei Geral de Proteção de Dados, a Lei
      13.709/2018) é:
    </p>
    <ul>
      <li>
        Responsável: <span class="legal-todo">[PREENCHER: nome completo ou razão social]</span>
      </li>
      <li>CNPJ: <span class="legal-todo">[PREENCHER: CNPJ, ou remover se pessoa física]</span></li>
      <li>
        Contato para assuntos de privacidade:
        <span class="legal-todo">[PREENCHER: e-mail de contato do titular]</span>
      </li>
    </ul>
    <p>
      É para esse endereço que você escreve se quiser exercer qualquer direito que não esteja
      disponível direto no app, ou se tiver dúvida sobre este texto.
    </p>

    <h2>Que dados coletamos</h2>

    <h3>Dados que você informa ao criar a conta</h3>
    <ul>
      <li><strong>Nome</strong> — aparece na interface para identificar você.</li>
      <li>
        <strong>E-mail</strong> — é com ele que você entra, e é por ele que enviamos a confirmação
        de endereço e o link de recuperação de senha.
      </li>
      <li>
        <strong>Senha</strong> — nunca é guardada como você digitou. Guardamos apenas um resultado
        irreversível (<em>hash</em> bcrypt). Nem nós conseguimos ler a sua senha; se você
        esquecê-la, o caminho é criar uma nova, não recuperar a antiga.
      </li>
      <li>
        <strong>Data da confirmação do e-mail</strong> e as datas de criação e de última alteração
        da conta.
      </li>
    </ul>

    <h3>Dados financeiros que você digita</h3>
    <p>
      Tudo nesta lista é informado por você, manualmente. O app não importa extrato, não lê conta
      bancária e não se conecta a instituição financeira nenhuma.
    </p>
    <ul>
      <li>
        <strong>Lançamentos</strong>: tipo (gasto no débito, gasto no crédito, receita, valor
        guardado, resgate, pagamento de fatura), descrição, valor, data, número de parcelas e a qual
        fatura o pagamento se refere.
      </li>
      <li><strong>Categorias</strong> que você cria: nome, cor e ícone.</li>
      <li>
        <strong>Metas</strong>: nome, descrição, valor desejado, valor já guardado, prazo e cor.
      </li>
      <li>
        <strong>Cartões</strong>: apelido do cartão, banco, tipo, limite, dia de fechamento, dia de
        vencimento, cor e <strong>apenas os quatro últimos dígitos</strong> do número.
      </li>
    </ul>

    <h3>Dados técnicos do uso</h3>
    <ul>
      <li>
        <strong>Endereço de IP</strong>, usado para contar requisições e barrar abuso — por exemplo,
        tentativas repetidas de adivinhar senha. É um contador temporário de segurança, não um
        histórico de navegação.
      </li>
      <li>
        <strong>Registros do servidor</strong> (logs), gerados automaticamente pela hospedagem, com
        data, rota acessada e código de resposta. Servem para investigar falha e abuso.
      </li>
    </ul>

    <h3>O que NÃO coletamos</h3>
    <p>
      Esta lista é tão importante quanto a de cima. O app não pede e não armazena: CPF, RG ou
      qualquer documento; endereço residencial; telefone; data de nascimento; foto; senha do seu
      banco; número completo de cartão ou código de segurança (CVV); dados de localização; nem
      qualquer dado sensível na definição da LGPD — origem racial, convicção religiosa, opinião
      política, saúde, vida sexual, biometria ou genética. Também não usamos cookie de publicidade
      nem pixel de rede social. Usamos uma ferramenta de medição de uso, e ela está descrita abaixo,
      em <strong>com quem compartilhamos</strong>: ela registra quais telas foram abertas, não o que
      está escrito nelas.
    </p>

    <h2>Para que usamos cada dado, e com qual base legal</h2>
    <p>
      A LGPD exige que todo tratamento de dado pessoal tenha uma base legal (artigo 7º). As nossas
      são estas:
    </p>
    <ul>
      <li>
        <strong>Manter sua conta e autenticar você</strong> — nome, e-mail e senha.
        <em>Base legal: execução de contrato</em> (artigo 7º, inciso V). Sem esses dados não existe
        conta, e sem conta não existe serviço.
      </li>
      <li>
        <strong>Mostrar e calcular suas finanças</strong> — lançamentos, categorias, metas, cartões
        e os painéis, faturas e projeções derivados deles.
        <em>Base legal: execução de contrato</em> (artigo 7º, inciso V). É exatamente o serviço que
        você pediu ao criar a conta.
      </li>
      <li>
        <strong>Confirmar que o e-mail é seu</strong> — envio do link de verificação.
        <em>Base legal: execução de contrato e legítimo interesse</em> (artigo 7º, incisos V e IX),
        no interesse de evitar que a conta de alguém seja aberta com o endereço de outra pessoa.
      </li>
      <li>
        <strong>Recuperar o acesso</strong> quando você esquece a senha — envio do link de
        redefinição. <em>Base legal: execução de contrato</em> (artigo 7º, inciso V).
      </li>
      <li>
        <strong>Proteger o serviço</strong> — limites de requisição por IP e registros do servidor.
        <em>Base legal: legítimo interesse</em> (artigo 7º, inciso IX), no interesse de manter o app
        disponível e as contas protegidas contra ataque automatizado.
      </li>
      <li>
        <strong>Entender se o app está sendo útil</strong> — caminho das telas abertas e três
        marcos de uso: visita, cadastro concluído e transação criada.
        <em>Base legal: legítimo interesse</em> (artigo 7º, inciso IX), no interesse de saber onde
        as pessoas desistem e consertar a parte que atrapalha. O que está escrito nos seus
        lançamentos não entra nessa medição.
      </li>
      <li>
        <strong>Corrigir falhas</strong> — registros técnicos de erro.
        <em>Base legal: legítimo interesse</em> (artigo 7º, inciso IX).
      </li>
      <li>
        <strong>Cumprir obrigação legal ou ordem judicial</strong>, se houver.
        <em>Base legal: cumprimento de obrigação legal</em> (artigo 7º, inciso II).
      </li>
    </ul>
    <p>
      Não usamos seus dados financeiros para publicidade, não os cruzamos com dados de outras
      pessoas e não os usamos para criar perfil de crédito, pontuação ou classificação de qualquer
      tipo.
    </p>

    <h2>Com quem compartilhamos</h2>
    <p>
      Não vendemos, não alugamos e não cedemos seus dados. Eles passam apenas pelas empresas que
      fazem o app funcionar — <strong>operadores</strong>, na linguagem da LGPD, que tratam os dados
      seguindo a nossa instrução e para nenhuma outra finalidade:
    </p>
    <ul>
      <li>
        <strong>MongoDB Atlas</strong> (MongoDB, Inc.) — é o banco de dados onde tudo fica
        armazenado: sua conta e seus lançamentos.
      </li>
      <li>
        <strong>Render</strong> (Render Services, Inc.) — hospeda o site e a API. Por lá passam as
        requisições do seu navegador e ficam os registros do servidor.
      </li>
      <li>
        <strong>Provedor de envio de e-mail</strong>:
        <span class="legal-todo">[PREENCHER: nome do provedor de e-mail]</span>. Recebe o seu
        endereço e o texto da mensagem, só para entregar a confirmação de cadastro e o link de
        recuperação de senha. Não enviamos e-mail de propaganda.
      </li>
      <li>
        <strong>Sentry</strong>
        <span class="legal-todo">[PREENCHER: razão social do Sentry]</span> — monitoramento de
        erro. Recebe só as falhas inesperadas do servidor: a mensagem técnica, o rastro de pilha e o
        <strong>identificador interno da sua conta</strong>. Não recebe o corpo da requisição, nem
        cabeçalhos, nem cookies — ou seja, não recebe o conteúdo dos seus lançamentos. Erro previsto,
        como um campo preenchido errado, não gera envio nenhum.
      </li>
      <li>
        <strong>PostHog</strong>
        <span class="legal-todo">[PREENCHER: razão social do PostHog]</span> — medição de uso.
        Serve para uma pergunta só: de cada cem pessoas que chegam ao app, quantas criam conta e
        quantas chegam a lançar a primeira transação. Recebe o <strong>caminho da tela</strong> que
        você abriu, sem nada do que vem depois do <code>?</code> no endereço, três marcos de uso
        (visita, cadastro concluído, transação criada) e o
        <strong>identificador interno da sua conta</strong>. O tipo do lançamento vai junto —
        receita, despesa, guardado —, mas <strong>nunca o valor nem a descrição</strong>. A captura
        automática de cliques e a gravação de tela, que a ferramenta oferece, estão
        <strong>desligadas</strong>.
      </li>
    </ul>
    <p>
      Podemos também compartilhar dados quando houver <strong>ordem judicial</strong> ou obrigação
      legal. Se isso acontecer e a lei permitir avisar, avisamos você.
    </p>

    <h2>Transferência internacional</h2>
    <p>
      As empresas acima têm servidores fora do Brasil, então seus dados podem ser armazenados e
      processados em outro país — o que a LGPD permite nas hipóteses do seu artigo 33, aqui a de
      transferência necessária à execução do contrato. A região em uso hoje é
      <span class="legal-todo"
        >[PREENCHER: região do cluster MongoDB Atlas e do serviço Render]</span
      >.
    </p>

    <h2>Quanto tempo guardamos</h2>
    <ul>
      <li>
        <strong>Sua conta e seus lançamentos</strong>: enquanto a conta existir. Não há prazo
        automático de descarte e não apagamos nada por conta própria.
      </li>
      <li>
        <strong>Quando você exclui a conta</strong>: apagamos na mesma hora, de forma definitiva, a
        conta e todo o histórico — lançamentos, categorias, metas e cartões. Não fica cópia nossa
        para você pedir depois, e não há como desfazer. É por isso que a tela recomenda exportar os
        dados antes.
      </li>
      <li>
        <strong>Link de recuperação de senha</strong>: vale 1 hora e é descartado assim que usado.
      </li>
      <li>
        <strong>Link de confirmação de e-mail</strong>: vale 24 horas e é descartado assim que
        usado.
      </li>
      <li>
        <strong>Sua sessão</strong>: o acesso dura 7 dias, depois dos quais é preciso entrar de
        novo.
      </li>
      <li>
        <strong>Registros do servidor e contadores de IP</strong>: ficam por pouco tempo, pelo prazo
        de retenção da hospedagem, e não são usados para outra finalidade.
      </li>
    </ul>
    <p>
      Uma ressalva honesta: os provedores de infraestrutura mantêm cópias de segurança próprias do
      banco de dados por alguns dias, como qualquer serviço gerenciado faz. Isso significa que,
      embora a exclusão seja imediata no banco em uso, um registro pode sobreviver nessas cópias
      técnicas até elas vencerem — depois disso, não.
      <span class="legal-todo"
        >[PREENCHER: prazo de retenção das cópias de segurança no plano contratado]</span
      >
    </p>

    <h2>Cookies e o que fica no seu navegador</h2>
    <p>
      O app <strong>não usa cookie</strong>, de rastreamento ou de qualquer outro tipo. O que fica
      guardado no seu navegador, no armazenamento local (<em>localStorage</em>), são duas coisas:
    </p>
    <ul>
      <li>
        o <strong>token da sua sessão</strong>, para que você não precise digitar a senha a cada
        visita. Vale 7 dias, é apagado quando você sai da conta, e nenhum dado seu é enviado a
        terceiros por meio dele;
      </li>
      <li>
        um <strong>identificador aleatório de medição</strong>, criado pelo PostHog para não contar
        a mesma pessoa duas vezes. Ele não tem o seu nome nem o seu e-mail, e também some quando
        você limpa os dados do navegador.
      </li>
    </ul>

    <h2>Como protegemos</h2>
    <ul>
      <li>Senha guardada apenas como hash bcrypt, irreversível, com custo 12.</li>
      <li>
        Links de e-mail guardados apenas como hash: um vazamento do banco não permitiria usar o link
        de ninguém.
      </li>
      <li>Tráfego entre o seu navegador e a API sempre por HTTPS.</li>
      <li>
        Toda consulta ao banco é restrita à sua conta. Nenhuma rota devolve dado de outro usuário,
        nem por engano de parâmetro.
      </li>
      <li>
        Rotas de senha e de conta têm limite próprio de tentativas — por exemplo, 3 tentativas por
        hora para confirmar a senha na exclusão da conta, o que inviabiliza força bruta.
      </li>
      <li>
        O número completo do cartão simplesmente não existe no sistema: guardamos quatro dígitos,
        que é o necessário para você reconhecer o cartão na tela.
      </li>
    </ul>
    <p>
      Nenhum sistema é inviolável, e dizer o contrário seria desonesto. Se um incidente de segurança
      relevante acontecer, comunicaremos você e a Autoridade Nacional de Proteção de Dados (ANPD),
      como manda o artigo 48 da LGPD.
    </p>

    <h2>Seus direitos, e como exercer cada um</h2>
    <p>
      O artigo 18 da LGPD lhe dá uma lista de direitos. Dois deles já estão prontos na interface, e
      você usa sem falar com ninguém:
    </p>
    <ul>
      <li>
        <strong>Acesso e portabilidade dos dados</strong> — entre em
        <strong>Minha conta → Exportar meus dados</strong>. O app baixa um arquivo JSON com a sua
        conta, todos os lançamentos, categorias, metas e cartões, incluindo a contagem de registros
        para você verificar se o arquivo veio completo.
      </li>
      <li>
        <strong>Eliminação dos dados</strong> — entre em
        <strong>Minha conta → Excluir minha conta</strong>, confirme com a sua senha atual, e tudo é
        apagado na hora. A tela mostra quantos registros foram removidos.
      </li>
      <li>
        <strong>Correção de dado incompleto ou desatualizado</strong> — os seus lançamentos,
        categorias, metas e cartões você edita direto nas telas do app. Para corrigir nome ou e-mail
        da conta, escreva para o contato de privacidade acima.
      </li>
    </ul>
    <p>Os demais direitos são exercidos pelo e-mail de contato indicado no começo deste texto:</p>
    <ul>
      <li>confirmação de que tratamos dados seus e acesso a eles;</li>
      <li>anonimização, bloqueio ou eliminação de dado desnecessário ou excessivo;</li>
      <li>informação sobre com quem compartilhamos seus dados;</li>
      <li>informação sobre a possibilidade de não fornecer consentimento e suas consequências;</li>
      <li>oposição a um tratamento feito com base em legítimo interesse;</li>
      <li>revisão de decisão automatizada — ver a seção seguinte.</li>
    </ul>
    <p>
      Respondemos em até 15 dias. Se você não ficar satisfeito com a resposta, pode reclamar à ANPD
      pelo site <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">gov.br/anpd</a>.
    </p>

    <h2>Decisões automatizadas</h2>
    <p>
      Nenhuma decisão sobre você é tomada automaticamente. Os painéis, as faturas e a projeção de
      caixa são aritmética aplicada aos números que você digitou — somas, médias e datas. Não há
      pontuação, análise de crédito, perfil de consumo nem recomendação automática de produto
      financeiro.
    </p>

    <h2>Crianças e adolescentes</h2>
    <p>
      O app é feito para maiores de 18 anos. Não coletamos dados de criança ou adolescente de forma
      consciente. Se isso acontecer, escreva para o contato acima e apagamos a conta.
    </p>

    <h2>Mudanças nesta política</h2>
    <p>
      Se o funcionamento do app mudar — provedor novo, dado novo, finalidade nova — este texto muda
      junto, com a data de vigência atualizada no alto da página. Mudança relevante é comunicada por
      e-mail antes de passar a valer.
    </p>

    <h2>Contato</h2>
    <p>
      Dúvida, pedido ou reclamação sobre privacidade:
      <span class="legal-todo">[PREENCHER: e-mail de contato do titular]</span>.
    </p>
  </LegalShell>
</template>
