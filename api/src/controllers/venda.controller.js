import Venda from '../models/Venda.js';
import Produto from '../models/Produto.js';
import { baixarEstoquePorItens, reporEstoquePorItens } from '../services/estoque.service.js';


function calcTotais(itens, descontoExtra=0){
  const bruto = itens.reduce((a,i)=>a+(i.qtd*i.precoUnit),0);
  const desconto = (itens.reduce((a,i)=>a+((i.desconto||0)),0)) + (descontoExtra||0);
  const liquido = Math.max(0, bruto - desconto);
  const qtdItens = itens.reduce((a,i)=>a+i.qtd,0);
  return { bruto, desconto, liquido, qtdItens };
}


export async function list(req,res){ try{
  const { q, page=1, limit=10, status } = req.query;
  const filter = {}; if(status) filter.status = status;
  if(q) filter.observacoes = new RegExp(q,'i');
  const skip = (Number(page)-1)*Number(limit);
  const [total,data] = await Promise.all([
    Venda.countDocuments(filter),
    Venda.find(filter).populate('cliente','nome').sort({createdAt:-1}).skip(skip).limit(Number(limit))
  ]);
  res.json({ total, page:Number(page), limit:Number(limit), data });
}catch(e){ res.status(500).json({error:e.message}); } }


export async function getById(req,res){ try{
  const v = await Venda.findById(req.params.id).populate('cliente','nome').populate('itens.produto','nome');
  if(!v) return res.status(404).json({error:'Venda não encontrada'});
  res.json(v);
}catch(e){ res.status(500).json({error:e.message}); } }


export async function create(req,res){ try{
  const itens = await Promise.all((req.body.itens||[]).map(async (i)=>{
    const prod = await Produto.findById(i.produto).select('nome precoVenda');
    if(!prod) throw new Error('Produto inválido');
    const precoUnit = Number(i.precoUnit ?? prod.precoVenda ?? 0);
    const qtd = Number(i.qtd||1);
    return { produto:i.produto, nomeProduto:prod.nome, qtd, precoUnit, subtotal:qtd*precoUnit };
  }));

  // 🔽 Controle de estoque: baixa as quantidades dos produtos
  await baixarEstoquePorItens(itens);

  const totais = calcTotais(itens, req.body.pagamento?.desconto||0);
  const venda = await Venda.create({ ...req.body, itens, totais, status:'rascunho' });
  res.status(201).json(venda);
}catch(e){ res.status(400).json({error:e.message}); } }



export async function update(req,res){ try{
  let payload = { ...req.body };
  if(payload.itens){
    const itens = await Promise.all(payload.itens.map(async (i)=>{
      const prod = await Produto.findById(i.produto).select('nome precoVenda');
      if(!prod) throw new Error('Produto inválido');
      const precoUnit = Number(i.precoUnit ?? prod.precoVenda ?? 0);
      const qtd = Number(i.qtd||1);
      return { produto:i.produto, nomeProduto:prod.nome, qtd, precoUnit, subtotal:qtd*precoUnit };
    }));
    payload.itens = itens;
    payload.totais = calcTotais(itens, payload.pagamento?.desconto||0);
  }
  const upd = await Venda.findByIdAndUpdate(req.params.id, payload, { new:true });
  if(!upd) return res.status(404).json({error:'Venda não encontrada'});
  res.json(upd);
}catch(e){ res.status(400).json({error:e.message}); } }


export async function finalizar(req,res){ try{
  const venda = await Venda.findById(req.params.id);
  if(!venda) return res.status(404).json({error:'Venda não encontrada'});
  if(venda.status === 'finalizada') return res.status(400).json({error:'Venda já finalizada'});
  venda.status = 'finalizada'; venda.dataFinalizacao = new Date(); await venda.save();
  res.json(venda);
}catch(e){ res.status(400).json({error:e.message}); } }


export async function cancelar(req,res){ try{
  const venda = await Venda.findById(req.params.id);
  if(!venda) return res.status(404).json({error:'Venda não encontrada'});
  venda.status = 'cancelada'; await venda.save(); res.json(venda);
}catch(e){ res.status(400).json({error:e.message}); } }


export async function remove(req,res){ try{
  const venda = await Venda.findById(req.params.id);
  if(!venda) return res.status(404).json({error:'Venda não encontrada'});

  // 🔼 Controle de estoque: devolve as quantidades dos itens
  await reporEstoquePorItens(venda.itens || []);

  await Venda.findByIdAndDelete(req.params.id);
  res.json({ok:true});
}catch(e){ res.status(400).json({error:e.message}); } }

// src/controllers/venda.controller.js

export const ultimasVendas = async (req, res) => {
    try {
        const vendas = await Venda.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("cliente")
            .populate("itens.produto");

        res.status(200).json(vendas);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao carregar últimas vendas" });
    }
};


