import Produto from '../models/Produto.js';
export async function list(req, res){ try{
  const { q, page=1, limit=10, status } = req.query;
  const filter = {}; if(status) filter.status = status;
  if(q){ filter.$or = [{nome:new RegExp(q,'i')},{categoria:new RegExp(q,'i')},{descricao:new RegExp(q,'i')},{ean:new RegExp(q,'i')}]; }
  const skip = (Number(page)-1)*Number(limit);
  const [total, data] = await Promise.all([
    Produto.countDocuments(filter),
    Produto.find(filter).populate('fornecedor','nome').sort({createdAt:-1}).skip(skip).limit(Number(limit))
  ]);
  res.json({ total, page:Number(page), limit:Number(limit), data });
}catch(e){ res.status(500).json({error:e.message}); } }
export async function getById(req,res){ try{
  const item = await Produto.findById(req.params.id);
  if(!item) return res.status(404).json({error:'Produto não encontrado'});
  res.json(item);
}catch(e){ res.status(500).json({error:e.message}); } }
export async function create(req,res){ try{
  const novo = await Produto.create(req.body);
  res.status(201).json(novo);
}catch(e){ res.status(400).json({error:e.message}); } }
export async function update(req,res){ try{
  const upd = await Produto.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if(!upd) return res.status(404).json({error:'Produto não encontrado'});
  res.json(upd);
}catch(e){ res.status(400).json({error:e.message}); } }
export async function remove(req,res){ try{
  const del = await Produto.findByIdAndDelete(req.params.id);
  if(!del) return res.status(404).json({error:'Produto não encontrado'});
  res.json({ok:true});
}catch(e){ res.status(400).json({error:e.message}); } }
