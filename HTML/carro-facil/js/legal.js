// Política de Privacidade, Termos de Uso e Suporte. TEXTOS-BASE: precisam de revisão jurídica antes da publicação nas lojas
// (preencha razão social, CNPJ e e-mails em js/config.js e marque documentosRevisados: true para tirar o aviso).
(() => {
  const { esc } = CF, cfg = window.CF_CONFIG || {};
  CF.docsVersao = '2026-10-01';
  const emp = () => esc(cfg.razaoSocial || '[razão social da empresa]');
  const cnpj = () => esc(cfg.cnpjEmpresa || '[CNPJ]');
  const mail = () => esc(cfg.suporteEmail || '[e-mail de suporte]');
  const dpo = () => esc(cfg.dpoEmail || cfg.suporteEmail || '[e-mail do encarregado de dados]');
  const aviso = () => cfg.documentosRevisados ? '' : '<p class="aviso-minuta" role="note"><strong>Minuta.</strong> Este texto ainda não foi revisado por um advogado.</p>';
  const doc = (titulo, corpo) => ({ html: `<section class="pagina estreita doc"><a class="voltar" href="#/">← Voltar</a><h2>${titulo}</h2>${aviso()}<p class="meta">Versão de ${CF.docsVersao}</p>${corpo}</section>` });

  CF.rotas.privacidade = async () => doc('Política de Privacidade', `
    <p>O <strong>Cadê meu carro?</strong> é operado por ${emp()} (CNPJ ${cnpj()}), controladora dos dados pessoais tratados no aplicativo, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
    <h3>Que dados coletamos</h3>
    <ul><li><strong>Conta:</strong> e-mail, senha (guardada de forma criptografada pelo provedor de autenticação) ou conta Google/Apple.</li>
      <li><strong>Perfil:</strong> nome, telefone, cidade e estado. Para garagistas: nome da garagem, CNPJ e telefone comercial.</li>
      <li><strong>Uso:</strong> favoritos, preferências de busca, passos do guia, interesses enviados às garagens.</li>
      <li><strong>Anúncios (garagistas):</strong> dados e fotos dos veículos, placa (visível só para a própria garagem) e resultado de consulta de placa.</li>
      <li><strong>Notificações:</strong> identificador do aparelho para enviar avisos, se você permitir.</li></ul>
    <h3>Para que usamos</h3>
    <ul><li>Mostrar carros, aproximar clientes e garagens e permitir contato por WhatsApp/telefone.</li>
      <li><strong>Compartilhar seu interesse de compra com garagens aprovadas</strong> somente se você marcar a autorização em “Minhas preferências”. Sem a autorização, sua busca só aparece em estatísticas agregadas e anônimas.</li>
      <li>Verificar garagens (CNPJ), cobrar mensalidades, prevenir fraude e responder denúncias.</li></ul>
    <h3>Com quem compartilhamos</h3>
    <p>Com as garagens para as quais você demonstra interesse ou que você autoriza; com provedores que operam o serviço (hospedagem e banco de dados, envio de e-mail e notificações, consulta de dados de veículos); e com autoridades, quando exigido por lei. Não vendemos seus dados.</p>
    <h3>Por quanto tempo</h3>
    <p>Enquanto a conta existir. Ao excluir a conta, apagamos perfil, preferências, favoritos, interesses, anúncios e fotos. Registros de cobrança de garagistas são mantidos, sem vínculo com a conta, pelo prazo exigido pela legislação fiscal.</p>
    <h3>Seus direitos</h3>
    <p>Você pode acessar, corrigir e excluir seus dados no próprio aplicativo (Minha conta → Editar perfil / Excluir minha conta), revogar a autorização de contato a qualquer momento e solicitar informações ao encarregado de dados: ${dpo()}.</p>
    <h3>Segurança</h3><p>Usamos conexão criptografada, controle de acesso por conta e regras de banco de dados que impedem ver dados de outras pessoas. Nenhum sistema é infalível; avise-nos se notar algo estranho.</p>
    <h3>Crianças</h3><p>O app não é destinado a menores de 18 anos.</p>`);

  CF.rotas.termos = async () => doc('Termos de Uso', `
    <p>Ao criar uma conta ou usar o <strong>Cadê meu carro?</strong>, você concorda com estes termos e com a <a href="#/privacidade">Política de Privacidade</a>.</p>
    <h3>O que somos</h3><p>Uma plataforma que aproxima clientes e garagens. <strong>Não vendemos carros, não participamos da negociação e não garantimos</strong> a veracidade dos anúncios, o estado ou a documentação dos veículos. Confira o carro, os documentos e a procedência pessoalmente antes de pagar.</p>
    <h3>Clientes</h3><p>Informe dados verdadeiros. Você decide se autoriza que garagens vejam seu interesse e pode revogar quando quiser.</p>
    <h3>Garagistas</h3>
    <ul><li>Só garagens com cadastro aprovado e assinatura em dia podem anunciar e ver clientes interessados.</li>
      <li>Anúncios devem ser reais, com fotos do próprio veículo, preço e dados corretos. Anúncios enganosos, golpes ou fotos de terceiros levam à remoção e à suspensão da conta.</li>
      <li>O contato de clientes só pode ser usado para tratar do veículo em questão, sem spam nem repasse a terceiros (LGPD).</li>
      <li>Mensalidades, créditos e prazos seguem o plano contratado, informado antes da contratação.</li></ul>
    <h3>Conteúdo e denúncias</h3><p>Você pode denunciar anúncios e ocultar garagens no próprio app. Analisamos denúncias e podemos remover conteúdo ou suspender contas que violem estes termos.</p>
    <h3>Encerramento</h3><p>Você pode excluir sua conta a qualquer momento em Minha conta. Podemos suspender contas que descumprirem estes termos.</p>
    <h3>Responsabilidade</h3><p>O serviço é prestado como está, sem garantia de disponibilidade contínua. Na extensão permitida em lei, não respondemos por negociações entre clientes e garagens.</p>
    <h3>Foro e contato</h3><p>Lei brasileira; foro do domicílio do consumidor. Dúvidas: ${mail()}.</p>`);

  CF.rotas.suporte = async () => doc('Suporte', `
    <p>Precisa de ajuda? Escreva para <strong>${mail()}</strong>${cfg.contatoComercial ? ` ou chame no <a target="_blank" rel="noopener" href="${CF.wa(cfg.contatoComercial, 'Olá! Preciso de ajuda no Cadê meu carro?')}">WhatsApp</a>` : ''}.</p>
    <ul><li>Excluir sua conta: Minha conta → Excluir minha conta.</li><li>Denunciar um anúncio: abra o carro e toque em “Denunciar anúncio”.</li><li>Dúvidas sobre dados pessoais: ${dpo()}.</li></ul>`);
})();
