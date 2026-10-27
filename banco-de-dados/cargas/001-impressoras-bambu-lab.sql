-- Impressoras 3D Bambu Lab (26/10/2026): cadastra no banco os 8 produtos de site/dados/produtos-novos.json.
-- O site no ar monta o catálogo pelo banco, e o "Importar produtos do site" do painel só funciona com o banco vazio.
-- Rode no phpMyAdmin, no banco do ambiente (raioxper_nfteste e/ou raioxper_nf), DEPOIS de publicar o código com as
-- fotos (public/produtos/bambu-lab-*) nesse ambiente. Se algum slug já existir, nada é gravado (transação).
-- Mesmos valores da importação inicial: estoque 1, venda e locação, sem destaque. Ajuste depois no painel.

SET NAMES utf8mb4;
START TRANSACTION;

-- Bambu Lab A1
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-a1', 'Bambu Lab', 'A1', 'Bambu Lab A1', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM de 256 x 256 x 256 mm, até 500 mm/s, com calibração automática e Wi-Fi',
'Impressora 3D rápida, silenciosa e fácil de usar, para makers, profissionais, escolas e empresas. Calibração automática, compensação ativa de vibração e controle inteligente de fluxo entregam resultados consistentes em cada projeto.

## Especificações

| Tecnologia | FDM
| Volume de impressão | 256 x 256 x 256 mm
| Velocidade | Até 500 mm/s
| Aceleração | Até 10.000 mm/s²
| Extrusora | Direct Drive, all metal, hotend de troca rápida
| Bico | Aço inoxidável
| Temperatura do bico | Até 300 °C
| Temperatura da mesa | Até 100 °C
| Mesa | Placa PEI texturizada Bambu
| Filamentos | PLA, PETG, TPU e PVA
| Câmera | Até 1080p, com timelapse
| Sensores | Fim de filamento, medição de filamento e emaranhado de filamento
| Recuperação após queda de energia | Sim
| Conectividade | Wi-Fi; app Bambu Handy e software Bambu Studio
| Tela | Touchscreen colorida',
1, 1, 1, 0, 'ativo', 0, 31);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-a1/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-a1/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-a1/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-a1/foto-4.jpg', 4),
  (@id, '/produtos/bambu-lab-a1/foto-5.jpg', 5);

-- Bambu Lab A1 Mini
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-a1-mini', 'Bambu Lab', 'A1 Mini', 'Bambu Lab A1 Mini', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM compacta de 180 x 180 x 180 mm, até 500 mm/s, com nivelamento automático',
'Impressora 3D compacta e versátil, que cabe em qualquer mesa. Fácil de montar e operar, é ideal para iniciantes, educadores e profissionais, com impressão de alta qualidade (camadas de até 0,1 mm).

## Especificações

| Tecnologia | FDM
| Volume de impressão | 180 x 180 x 180 mm
| Velocidade | Até 500 mm/s
| Extrusora | Direct Drive, 1 extrusor
| Bico | Aço inoxidável
| Temperatura do bico | Até 300 °C
| Temperatura da mesa | Até 80 °C
| Mesa | Placa de aço flexível com folha PEI
| Filamentos | PLA, PETG, TPU e PVA (1,75 mm)
| Nivelamento | Automático
| Câmera | Integrada
| Sensores | Desvio de filamento; recuperação após queda de energia
| Conectividade | Wi-Fi e USB
| Tela | Touchscreen
| Consumo | 150 W',
1, 1, 1, 0, 'ativo', 0, 32);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-a1-mini/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-a1-mini/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-a1-mini/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-a1-mini/foto-4.jpg', 4),
  (@id, '/produtos/bambu-lab-a1-mini/foto-5.jpg', 5),
  (@id, '/produtos/bambu-lab-a1-mini/foto-6.jpg', 6);

-- Bambu Lab A1 Mini Combo
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-a1-mini-combo', 'Bambu Lab', 'A1 Mini Combo', 'Bambu Lab A1 Mini Combo', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM compacta e multicolorida de 180 x 180 x 180 mm, com AMS Lite incluso',
'A A1 Mini com o sistema multicores AMS Lite incluso, para imprimir em até 4 cores com troca automática de filamento. Compacta, com nivelamento automático e sistema de filamento aberto, que aceita rolos de várias marcas. Imprime peças robustas com rapidez, de baixo para cima, e é ótima para começar com PLA.

## Especificações

| Tecnologia | FDM
| Volume de impressão | 180 x 180 x 180 mm
| Multicolor | AMS Lite incluso (até 4 cores)
| Extrusor | 1 extrusor
| Temperatura do bico | Até 300 °C
| Mesa | Aquecida
| Filamento | 1,75 mm, sistema aberto; ideal para PLA
| Resolução | Camadas a partir de 100 µm
| Nivelamento | Automático
| Dimensões (C x L x A) | 43 x 38,5 x 49,5 cm
| Peso | 6 kg',
1, 1, 1, 0, 'ativo', 0, 33);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-4.jpg', 4),
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-5.jpg', 5),
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-6.jpg', 6),
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-7.jpg', 7),
  (@id, '/produtos/bambu-lab-a1-mini-combo/foto-8.jpg', 8);

-- Bambu Lab A2L Combo
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-a2l-combo', 'Bambu Lab', 'A2L Combo', 'Bambu Lab A2L Combo', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM de 330 x 320 x 325 mm, multicolorida com AMS, e módulos opcionais de corte e desenho',
'Plataforma criativa com volume extra grande, cerca de 65% maior que o da A1, para capacetes de cosplay, protótipos funcionais, peças decorativas e componentes mecânicos sem dividir o modelo. Impressão multicolorida automática com o AMS incluso.

## Destaques

- Volume de impressão extra grande
- Impressão 3D, corte e desenho em uma única plataforma
- Impressão multicolorida automática

## Especificações

| Tecnologia | FDM
| Volume de impressão | 330 x 320 x 325 mm
| Multicolor | AMS incluso, troca de filamento automática
| Módulos opcionais | Corte (adesivos, etiquetas, embalagens) e desenho com caneta
| Alinhamento | Pela câmera do celular, para corte e desenho
| Automação | Calibração automática, compensação de vibração, monitoramento por câmera
| Sensores | Fim de filamento, emaranhamento e recuperação após queda de energia
| Software | Bambu Studio, app Bambu Handy e MakerWorld
| Montagem | Não requer
| Tensão | 127 V
| Itens inclusos | Impressora A2L e AMS',
1, 1, 1, 0, 'ativo', 0, 34);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-a2l-combo/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-a2l-combo/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-a2l-combo/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-a2l-combo/foto-4.jpg', 4),
  (@id, '/produtos/bambu-lab-a2l-combo/foto-5.jpg', 5),
  (@id, '/produtos/bambu-lab-a2l-combo/foto-6.jpg', 6),
  (@id, '/produtos/bambu-lab-a2l-combo/foto-7.jpg', 7);

-- Bambu Lab P2S Combo
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-p2s-combo', 'Bambu Lab', 'P2S Combo', 'Bambu Lab P2S Combo', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM fechada de 256 x 256 x 256 mm, com AMS 2 Pro para impressão multicolorida e secagem de filamento',
'Alta velocidade, precisão profissional e automação inteligente: extrusor servo de alta precisão, controle inteligente de fluxo, câmara fechada com controle térmico e o AMS 2 Pro para impressão multicolorida automática com secagem integrada. Para prototipagem, engenharia, peças técnicas e pequena produção.

## Especificações

| Tecnologia | FDM, câmara fechada com filtro de carbono
| Volume de impressão | 256 x 256 x 256 mm
| Extrusor | Servo PMSM, até 8,5 kg de força de extrusão
| Temperatura do bico | Até 300 °C
| Bicos compatíveis | 0,2, 0,4, 0,6 e 0,8 mm, troca rápida
| Filamento | 1,75 mm
| Mesa | Placa de aço flexível
| Multicolor | AMS 2 Pro incluso, com secagem integrada
| Detecção de falhas | Automática, com inteligência artificial
| Câmera | 1080p, monitoramento remoto e timelapse
| Tela | Touchscreen colorida de 5"
| Conectividade | Wi-Fi de banda dupla e USB
| Software | Bambu Studio (Windows, macOS e Linux)
| Consumo | Até 1.200 W (220 V); cerca de 200 W imprimindo PLA',
1, 1, 1, 0, 'ativo', 0, 35);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-p2s-combo/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-p2s-combo/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-p2s-combo/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-p2s-combo/foto-4.jpg', 4),
  (@id, '/produtos/bambu-lab-p2s-combo/foto-5.jpg', 5),
  (@id, '/produtos/bambu-lab-p2s-combo/foto-6.jpg', 6),
  (@id, '/produtos/bambu-lab-p2s-combo/foto-7.jpg', 7),
  (@id, '/produtos/bambu-lab-p2s-combo/foto-8.jpg', 8);

-- Bambu Lab X1 Carbon Combo
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-x1-carbon-combo', 'Bambu Lab', 'X1 Carbon Combo', 'Bambu Lab X1 Carbon Combo', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM fechada para materiais de engenharia e fibra de carbono, com AMS para até 16 cores',
'Materiais avançados para projetos avançados: com refrigeração extra, bico e engrenagem de aço endurecido, a X1-Carbon imprime PA, PC, PET e TPU e é especializada em polímeros reforçados com fibra de carbono e fibra de vidro. O AMS incluso permite imprimir em várias cores e materiais.

## Especificações

| Tecnologia | FDM, câmara fechada
| Aceleração | Até 20.000 mm/s²
| Bico | Aço endurecido
| Filamentos | PLA, PETG, PA, PC, PET, TPU e compostos com fibra de carbono ou de vidro
| Multicolor | AMS incluso; até 16 cores com AMS adicionais (opcional)
| Nivelamento | Duplo nivelamento automático da mesa
| Lidar | Resolução de 7 μm; primeira camada inspecionada por IA
| Qualidade | Compensação ativa de vibração (XY) e compensação de extrusão
| Sensores | Detecção de filamento
| Tensão | Bivolt',
1, 1, 1, 0, 'ativo', 0, 36);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-x1-carbon-combo/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-x1-carbon-combo/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-x1-carbon-combo/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-x1-carbon-combo/foto-4.jpg', 4);

-- Bambu Lab X2D Combo
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-x2d-combo', 'Bambu Lab', 'X2D Combo', 'Bambu Lab X2D Combo', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM fechada de alta performance, com AMS 2 Pro para múltiplos filamentos',
'Fabricação aditiva de alta performance em um design compacto. O AMS 2 Pro integrado gerencia múltiplos filamentos durante a impressão, o nivelamento automático garante precisão em cada projeto e o sistema de filamento aberto aceita diversos materiais do mercado.

## Especificações

| Tecnologia | FDM, câmara fechada
| Multicolor | AMS 2 Pro incluso
| Nivelamento | Automático
| Filamentos | Sistema aberto (aceita filamentos de outras marcas)
| Dimensões (C x L x A) | 40,6 x 39,2 x 47,8 cm
| Tensão | 110 V
| Peso com embalagem | 23 kg',
1, 1, 1, 0, 'ativo', 0, 37);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-x2d-combo/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-x2d-combo/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-x2d-combo/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-x2d-combo/foto-4.jpg', 4),
  (@id, '/produtos/bambu-lab-x2d-combo/foto-5.jpg', 5);

-- Bambu Lab H2C Combo
INSERT INTO produtos (slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao, disponivel_venda, disponivel_locacao, estoque, estoque_minimo, status, destaque, ordem)
VALUES ('bambu-lab-h2c-combo', 'Bambu Lab', 'H2C Combo', 'Bambu Lab H2C Combo', 'impressoras-3d', NULL, 'novo', 'Impressora 3D FDM fechada com troca de bicos e AMS 2 Pro, para materiais de alto desempenho',
'Para entusiastas e profissionais que buscam qualidade e eficiência, de protótipos a peças funcionais. Os sensores do servo motor no extrusor controlam a extrusão com precisão para superfícies suaves e bordas definidas, e o AMS 2 Pro incluso permite impressão em várias cores.

## Especificações

| Tecnologia | FDM, câmara fechada
| Bicos | Sistema com até 7 bicos, até 350 °C
| Multicolor | AMS 2 Pro incluso
| Mesa | Aquecida
| Nivelamento | Automático
| Filamentos | PLA, ABS, nylon e materiais de alto desempenho
| Montagem | Não requer
| Tensão | 110–127 V',
1, 1, 1, 0, 'ativo', 0, 38);
SET @id = LAST_INSERT_ID();
INSERT INTO produto_fotos (produto_id, url, ordem) VALUES
  (@id, '/produtos/bambu-lab-h2c-combo/foto-1.jpg', 1),
  (@id, '/produtos/bambu-lab-h2c-combo/foto-2.jpg', 2),
  (@id, '/produtos/bambu-lab-h2c-combo/foto-3.jpg', 3),
  (@id, '/produtos/bambu-lab-h2c-combo/foto-4.jpg', 4),
  (@id, '/produtos/bambu-lab-h2c-combo/foto-5.jpg', 5),
  (@id, '/produtos/bambu-lab-h2c-combo/foto-6.jpg', 6);

COMMIT;
