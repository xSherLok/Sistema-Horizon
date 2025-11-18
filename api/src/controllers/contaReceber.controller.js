import ContaReceber from '../models/ContaReceber.js';
export async function list(req,res){ try{
  const { q, page=1, limit=10, status } = req.query;
  const filter = {}; if(status) filter.status = status;
  if(q){ filter.$or = [{documento:new RegExp(q,'i')},{categoria:new RegExp(q,'i')},{centroCusto:new RegExp(q,'i')}]; }
  const skip = (Number(page)-1)*Number(limit);
  const [total,data] = await Promise.all([
    ContaReceber.countDocuments(filter),
    ContaReceber.find(filter).populate('cliente','nome').sort({createdAt:-1}).skip(skip).limit(Number(limit))
  ]);
  res.json({ total, page:Number(page), limit:Number(limit), data });
}catch(e){ res.status(500).json({error:e.message}); } }
export async function getById(req,res){ try{
  const c = await ContaReceber.findById(req.params.id).populate('cliente','nome');
  if(!c) return res.status(404).json({error:'Conta a receber não encontrada'});
  res.json(c);
}catch(e){ res.status(500).json({error:e.message}); } }
export async function create(req,res){ try{
  const novo = await ContaReceber.create(req.body); res.status(201).json(novo);
}catch(e){ res.status(400).json({error:e.message}); } }
export async function update(req,res){ try{
  const upd = await ContaReceber.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if(!upd) return res.status(404).json({error:'Conta a receber não encontrada'});
  res.json(upd);
}catch(e){ res.status(400).json({error:e.message}); } }
export async function receber(req,res){ try{
  const c = await ContaReceber.findById(req.params.id);
  if(!c) return res.status(404).json({error:'Conta a receber não encontrada'});
  c.status='recebida'; c.recebimento=new Date(); await c.save(); res.json(c);
}catch(e){ res.status(400).json({error:e.message}); } }
export async function remove(req,res){ try{
  await ContaReceber.findByIdAndDelete(req.params.id); res.json({ok:true});
}catch(e){ res.status(400).json({error:e.message}); } }
