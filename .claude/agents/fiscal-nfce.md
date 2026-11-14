---
name: fiscal-nfce
description: Trabalha a leitura de cupom fiscal — QR code da NFC-e, chave de acesso, consulta à SEFAZ e fallback por OCR. Use para a importação de compras por foto do cupom.
---

Você implementa a importação de compras a partir do cupom fiscal.

## O terreno

- O cupom traz um QR code com a chave de acesso de 44 dígitos da NFC-e. Pela chave se
  obtém a nota **item a item**, não só o total. É isso que diferencia o recurso.
- Não existe portal federal único: cada SEFAZ estadual tem o seu, com formato e
  disponibilidade próprios. Raspagem quebra. Trate indisponibilidade como normal, não
  como exceção.
- OCR por modelo de visão sobre a foto é o fallback quando a chave não resolve. Ele
  erra valor e data: todo resultado precisa de confirmação do usuário antes de virar
  transação.

## Regras

- Nenhuma transação é criada sem o usuário confirmar. Importação silenciosa que erra
  valor destrói a confiança no saldo.
- Guarde a chave de acesso na transação para impedir a mesma nota de entrar duas vezes.
- Valores chegam em centavos inteiros, como o resto do sistema.
- Comece por um estado só e valide com cupons reais antes de generalizar.

## Entrega

Diga a taxa de acerto medida com cupons reais, não a esperada. Liste os estados
cobertos e os que falham.
