import { extrai, consultaGenerica, combustivelPadrao } from './provedor.ts';
let falhas = 0; const ok = (n: string, c: boolean, extra = '') => { console.log((c ? 'ok  ' : 'FALHA ') + n + ' ' + extra); if (!c) falhas++; };
const mapa = { marca: 'dados.marca', modelo: 'dados.modelo', ano_fabricacao: 'dados.ano', ano_modelo: 'dados.anoModelo', cor: 'dados.cor', combustivel: 'dados.comb', erro_se: 'erro' };
const bom = { dados: { marca: 'VW', modelo: ' GOL  1.6 ', ano: '2017', anoModelo: '2018', cor: 'Prata', comb: 'ALCOOL / GASOLINA', proprietario: 'FULANO', cpf: '123' } };
const d = extrai(bom, mapa); ok('mapeia e normaliza', d.marca === 'VW' && d.modelo === 'GOL 1.6' && d.ano_fabricacao === 2017 && d.ano_modelo === 2018 && d.combustivel === 'Flex', JSON.stringify(d));
ok('descarta dados de proprietário', !('proprietario' in d) && !('cpf' in d));
const d2 = extrai({ dados: { marca: 'FIAT', modelo: 'UNO', ano: '2019/2020' } }, { marca: 'dados.marca', modelo: 'dados.modelo', ano_fabricacao: 'dados.ano', ano_modelo: 'dados.ano' }); ok('ano "2019/2020"', d2.ano_fabricacao === 2019 && d2.ano_modelo === 2020, JSON.stringify(d2));
const so1 = extrai({ a: { m: 'FORD', mo: 'KA', ano: 2015 } }, { marca: 'a.m', modelo: 'a.mo', ano_fabricacao: 'a.ano' }); ok('só um ano', so1.ano_fabricacao === 2015 && so1.ano_modelo === 2015);
try { extrai({ erro: 'Placa não encontrada' }, mapa); ok('erro_se', false); } catch (e) { ok('erro_se => placa_nao_encontrada', (e as Error).message === 'placa_nao_encontrada'); }
try { extrai({ dados: { marca: 'X' } }, mapa); ok('incompleto', false); } catch (e) { ok('retorno incompleto', (e as Error).message === 'retorno_incompleto'); }
ok('combustíveis', combustivelPadrao('Gasolina') === 'Gasolina' && combustivelPadrao('DIESEL') === 'Diesel' && combustivelPadrao('Elétrico') === 'Elétrico' && combustivelPadrao('Híbrido/Gasolina') === 'Híbrido');
let visto: any = null;
const fake = (status: number, corpo: any) => async (u: any, o: any) => { visto = { u: String(u), h: o.headers }; return new Response(JSON.stringify(corpo), { status }); };
const cfg = { placa_api_url: 'https://api.exemplo.com/p/{placa}?t={token}', placa_api_token: 'SEG RETO', placa_api_headers: '{"Authorization":"Bearer {token}"}', placa_api_mapa: JSON.stringify(mapa) };
const r = await consultaGenerica(cfg, 'ABC1D23', fake(200, bom) as any); ok('consulta ok', r.marca === 'VW', visto.u + ' ' + JSON.stringify(visto.h));
ok('token e placa substituídos e escapados', visto.u.includes('ABC1D23') && visto.u.includes('SEG%20RETO') && visto.h.Authorization === 'Bearer SEG RETO');
for (const [st, esperado] of [[404, 'placa_nao_encontrada'], [500, 'provedor_falhou'], [429, 'provedor_falhou']] as const) { try { await consultaGenerica(cfg, 'ABC1D23', fake(st, {}) as any); ok('status ' + st, false); } catch (e) { ok('status ' + st + ' => ' + esperado, (e as Error).message === esperado); } }
try { await consultaGenerica({}, 'ABC1D23'); ok('sem config', false); } catch (e) { ok('sem config => provedor_nao_configurado', (e as Error).message === 'provedor_nao_configurado'); }
try { await consultaGenerica({ ...cfg, placa_api_mapa: '{quebrado' }, 'ABC1D23', fake(200, bom) as any); ok('mapa inválido', false); } catch (e) { ok('mapa inválido => provedor_nao_configurado', (e as Error).message === 'provedor_nao_configurado'); }
console.log(falhas ? falhas + ' FALHAS' : 'todos passaram');
