$(document).ready(function() {
      // Inicializa DataTables
      var table = $('#clientes').DataTable({
        paging: true,
        searching: true,
        info: false,
        responsive: true
      });

      // Botão de adicionar novo cliente
      $('#btnAddCliente').on('click', function() {
        let nome = prompt("Digite o nome do cliente:");
        let email = prompt("Digite o email do cliente:");
        let telefone = prompt("Digite o telefone do cliente:");
        if(nome && email && telefone) {
          let id = table.rows().count() + 1;
          table.row.add([
            id,
            nome,
            email,
            telefone,
            `<button class="btn-edit">Editar</button> <button class="btn-delete">Excluir</button>`
          ]).draw(false);
        }
      });

      // Delegação de evento para excluir linha
      $('#clientes tbody').on('click', '.btn-delete', function() {
        if(confirm("Deseja realmente excluir este cliente?")) {
          table.row($(this).parents('tr')).remove().draw();
        }
      });

      // Delegação de evento para editar linha
      $('#clientes tbody').on('click', '.btn-edit', function() {
        let row = table.row($(this).parents('tr'));
        let data = row.data();
        let nome = prompt("Editar nome:", data[1]);
        let email = prompt("Editar email:", data[2]);
        let telefone = prompt("Editar telefone:", data[3]);
        if(nome && email && telefone) {
          row.data([data[0], nome, email, telefone, data[4]]).draw(false);
        }
      });
    });