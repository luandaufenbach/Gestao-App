<script setup>
/**
 * Termos de uso (ROADMAP 0.7).
 *
 * Como a política de privacidade, este texto descreve o que o sistema REALMENTE
 * faz, e não um modelo de contrato. O que está escrito aqui saiu de:
 *
 *   - o que o app é .......... backend/src/models/Transaction.js (lançamento é
 *                              digitado; não há importação de extrato nem
 *                              conexão com banco)
 *   - cálculos exibidos ...... backend/src/utils/invoiceCycle.js e os
 *                              controllers de dashboard e projeção
 *   - regra da senha ......... backend/src/validators/authValidators.js
 *   - limites de uso ......... backend/src/app.js, routes/auth.js,
 *                              routes/account.js
 *   - exportar e excluir ..... backend/src/controllers/accountController.js
 *   - gratuito hoje .......... não existe nenhuma rota de cobrança no backend
 *
 * Cuidado ao prometer: tudo o que este texto afirma sobre disponibilidade,
 * cópia de segurança e preço precisa continuar verdadeiro depois de cada
 * mudança de infraestrutura. Promessa quebrada em termos de uso é dano ao
 * consumidor, não detalhe de redação.
 */
import LegalShell from "../components/LegalShell.vue";
</script>

<template>
  <LegalShell
    title="Termos de uso"
    counterpart-to="/privacy"
    counterpart-label="Ler também a Política de privacidade"
  >
    <h2>O combinado, em cinco linhas</h2>
    <p>
      O Gestão App é uma ferramenta para você organizar o seu próprio dinheiro: você digita o que
      entra e o que sai, e o app soma, separa por categoria, monta as faturas dos cartões e projeta
      os próximos meses.
      <strong
        >Ele não se conecta ao seu banco, não movimenta dinheiro e não dá recomendação de
        investimento.</strong
      >
      Os dados são seus: dá para baixar todos e apagar a conta a qualquer momento. Em troca, você
      mantém sua senha em segurança e usa o app sem tentar atacá-lo.
    </p>

    <h2>Quem oferece o serviço</h2>
    <ul>
      <li>
        Responsável: <span class="legal-todo">[PREENCHER: nome completo ou razão social]</span>
      </li>
      <li>CNPJ: <span class="legal-todo">[PREENCHER: CNPJ, ou remover se pessoa física]</span></li>
      <li>Contato: <span class="legal-todo">[PREENCHER: e-mail de contato do titular]</span></li>
    </ul>
    <p>
      Ao criar uma conta você concorda com estes termos. Se não concordar com algum ponto, o caminho
      honesto é não criar a conta — ou excluí-la, se já tiver criado.
    </p>

    <h2>O que o app é — e o que ele não é</h2>
    <p><strong>É:</strong></p>
    <ul>
      <li>um registro manual das suas receitas e despesas, por categoria;</li>
      <li>
        um controle de cartões de crédito, com fechamento, vencimento, parcelas e pagamento de
        fatura;
      </li>
      <li>um acompanhamento de metas de dinheiro guardado;</li>
      <li>
        uma projeção dos próximos meses, calculada a partir do que você mesmo lançou — inclusive as
        parcelas futuras.
      </li>
    </ul>
    <p><strong>Não é:</strong></p>
    <ul>
      <li>
        <strong>instituição financeira.</strong> O app não guarda, não transfere e não investe
        dinheiro. Nenhum centavo passa por aqui — só o registro de que ele passou por você;
      </li>
      <li>
        <strong>conectado ao seu banco.</strong> Não há importação de extrato, Open Finance ou
        leitura de conta. Tudo o que aparece na tela foi digitado por você;
      </li>
      <li>
        <strong>consultoria financeira.</strong> Os números exibidos são contas feitas sobre os seus
        lançamentos, não recomendação de gastar, poupar ou investir. Decisão sobre o seu dinheiro é
        sua;
      </li>
      <li>
        <strong>substituto de documento fiscal ou contábil.</strong> Para imposto de renda,
        prestação de contas ou qualquer uso oficial, valem os documentos do banco e da Receita, não
        o relatório do app.
      </li>
    </ul>

    <h2>Sua conta</h2>
    <ul>
      <li>
        A conta é pessoal, de uma pessoa maior de 18 anos, e usa um e-mail que seja realmente seu —
        confirmado pelo link que enviamos no cadastro.
      </li>
      <li>
        A senha precisa ter no mínimo 8 caracteres, com pelo menos uma letra e um número. Guardá-la
        em segurança é sua responsabilidade: quem tem a sua senha vê e altera todos os seus dados.
      </li>
      <li>
        Nós não conseguimos ler a sua senha — ela é guardada de forma irreversível. Se esquecer, use
        "Esqueci minha senha" para criar outra.
      </li>
      <li>
        Se desconfiar que alguém entrou na sua conta, troque a senha imediatamente. A troca encerra
        o acesso dos links de recuperação pendentes.
      </li>
    </ul>

    <h2>Preço</h2>
    <p>
      Hoje o uso é <strong>gratuito</strong> e não há nenhuma forma de cobrança no sistema. Se no
      futuro existir um plano pago, o preço, o que ele inclui e a data de início serão informados
      <strong>antes</strong> de passarem a valer, e nada será cobrado de você sem que você contrate
      explicitamente. Recurso que hoje é gratuito e passe a ser pago será avisado com antecedência
      razoável, e você continuará podendo exportar e apagar seus dados de graça em qualquer cenário.
    </p>

    <h2>O que você não pode fazer</h2>
    <ul>
      <li>tentar acessar a conta ou os dados de outra pessoa;</li>
      <li>
        procurar falha de segurança para explorar. Se encontrar uma, avise no contato acima — isso
        ajuda todo mundo;
      </li>
      <li>
        automatizar requisições em volume, raspar dados ou sobrecarregar o serviço de propósito. O
        app tem limites de requisição e eles serão aplicados;
      </li>
      <li>usar o app para atividade ilícita, como registro de operação de origem criminosa;</li>
      <li>revender o acesso, nem apresentar o app como se fosse seu.</li>
    </ul>
    <p>
      Conta que descumprir esta seção pode ser suspensa ou encerrada. Quando der tempo e for
      razoável, avisamos antes para você exportar seus dados.
    </p>

    <h2>Disponibilidade, e o que isso significa na prática</h2>
    <p>
      O serviço é oferecido <strong>no estado em que se encontra</strong>, sem garantia de
      funcionamento ininterrupto. Pode haver manutenção, instabilidade da hospedagem, lentidão no
      primeiro acesso do dia ou indisponibilidade temporária. Não há prazo de resposta contratado
      nem compromisso de tempo de atividade.
    </p>
    <p>
      Consequência prática, dita sem rodeio:
      <strong>não dependa do app como cópia única dos seus dados.</strong> Use
      <strong>Minha conta → Exportar meus dados</strong> de vez em quando e guarde o arquivo. Não
      mantemos cópia de segurança à disposição do usuário para pedido individual, e dado excluído
      por você não volta.
    </p>

    <h2>Seus dados</h2>
    <p>
      O conteúdo que você lança continua sendo seu. Não o usamos para outra finalidade além de
      prestar o serviço, não o vendemos e não o compartilhamos com anunciante. O detalhe de quais
      dados existem, por quanto tempo e com quem passam está na
      <strong>Política de privacidade</strong>, que é parte destes termos.
    </p>
    <p>
      O software em si — código, interface, nome e identidade visual — é do responsável indicado no
      começo deste texto. Estes termos lhe dão permissão de usar o app, não de copiá-lo ou
      redistribuí-lo.
    </p>

    <h2>Encerramento</h2>
    <ul>
      <li>
        <strong>Por você</strong>, a qualquer momento, em
        <strong>Minha conta → Excluir minha conta</strong>. A exclusão apaga a conta e todo o
        histórico de imediato, sem como desfazer.
      </li>
      <li>
        <strong>Por nós</strong>, em caso de descumprimento destes termos, ou se o serviço for
        descontinuado. Se o app for encerrado, avisaremos por e-mail com antecedência para que você
        exporte seus dados.
      </li>
    </ul>

    <h2>Responsabilidade</h2>
    <p>
      O app é uma calculadora sobre números que você digitou: se o lançamento estiver errado, o
      resultado estará errado. Não respondemos por decisão financeira tomada com base no que a tela
      mostra, nem por prejuízo decorrente de dado digitado incorretamente, de indisponibilidade do
      serviço ou de acesso indevido causado por senha compartilhada.
    </p>
    <p>
      Nada nesta seção afasta os direitos que o Código de Defesa do Consumidor lhe garante, nem
      nossa responsabilidade por falha própria e por dano causado por culpa nossa. Cláusula que
      tente excluir isso é nula, e não é o que pretendemos aqui.
    </p>

    <h2>Mudanças nestes termos</h2>
    <p>
      Podemos alterar este texto quando o app mudar. A data de vigência no alto da página é
      atualizada em toda alteração, e mudança relevante é comunicada por e-mail antes de valer.
      Continuar usando o app depois disso significa que você aceitou a versão nova; se não aceitar,
      exclua a conta — exportando seus dados antes, se quiser guardá-los.
    </p>

    <h2>Lei aplicável e foro</h2>
    <p>
      Valem as leis brasileiras, entre elas o Código de Defesa do Consumidor (Lei 8.078/1990), o
      Marco Civil da Internet (Lei 12.965/2014) e a Lei Geral de Proteção de Dados (Lei
      13.709/2018). Eventual disputa pode ser levada ao foro do seu domicílio, como assegura o
      Código de Defesa do Consumidor.
      <span class="legal-todo"
        >[PREENCHER: cidade e estado do responsável, se houver preferência]</span
      >
    </p>

    <h2>Contato</h2>
    <p>
      Dúvida sobre estes termos:
      <span class="legal-todo">[PREENCHER: e-mail de contato do titular]</span>.
    </p>
  </LegalShell>
</template>
