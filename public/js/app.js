(function () {

    function init () {
        loadHandlers();
        loadTasks();
        loadHistory();

        
        function loadTasks () {
            fetch(`/getTasks`) 
            .then(resp => {
                return resp.json();
            })
            .then( data => {
                data.forEach( task => {
                    renderTask(task);
                });
            });
        }
    
        function loadHistory () {
            fetch(`/getHistory`)
            .then(resp => {
                return resp.json();
            })
            .then( data => {
                data.forEach( task => {
                    addTaskToHistory(task);
                });
            });
        }
    }

    function loadHandlers () {

        // Variable Declarations

        let editTaskObj = {};

        // MODAL HANDLERS //

        // Load The Add Task Modal Handler

        $('#taskSubmitModal') 
            .click( function (ev)  {
                const target = ev.target;
                switch(target.id) {
                    case 'cancelSubmitTask' :
                        emptyFormFields('Add', true);
                        disableButton('submitTask');
                        break;
                    case 'submitTask' : 
                        submitTask();
                        emptyFormFields('Add', true);
                        disableButton('submitTask');
                        break;
                    default : 
                        if(target.tagName === 'SPAN') {
                            emptyFormFields('Add', true);
                            disableButton('submitTask');
                        }
                        break;
                }
            });

        // Load The Edit Task Modal Handler

        $('#taskEditModal')
            .click( function (ev) {

                // Load The Task Data
                const target = ev.target;

                if(target.id === 'editTask') {
                    editTask();
                }
            })

        // Load The Delete All Modal Handler

        $('#deleteAll')
            .click( function () {
                const idArray = $('#taskContainer').children().toArray().map(task => $(task).data().dataId);

                fetch(`/deleteAll`, {
                    method : 'DELETE',
                    body : JSON.stringify({
                        ids : idArray
                    }),
                    headers : {
                        'Content-Type' : 'application/json'
                    }
                })
                .then( resp => {
                    if(resp.status === 404) throw new Error();
                    return resp.json();
                })
                .then( data => {
                    data.forEach( task => modifyTaskHistory(task));
                    $('#taskContainer').html('');
                });
            });
        
        // ----------------------------------------------------//

        // Load The Initial Input Settings For The Add Task Form

        disableButton('submitTask');

        $('#formAddTitle').on('input', function () {
            const id = 'submitTask';
            (this.value && $('#formAddBody').val()) ? 
                enableButton(id) : disableButton(id);
        });
    
        $('#formAddBody').on('input', function () {
            const id = 'submitTask';
            (this.value && $('#formAddTitle').val()) ? 
                enableButton(id) : disableButton(id);
        });

        // Load The Initial Input Settings For The Edit Task Form

        $('#formEditTitle').on('input', function () {
            const id = 'editTask';
            (this.value && $('#formEditBody').val()) ? 
                enableButton(id) : disableButton(id);
        });

        $('#formEditBody').on('input', function () {
            const id = 'editTask';
            (this.value && $('#formEditTitle').val()) ? 
                enableButton(id) : disableButton(id);
        });

        // Load The Clear History Handler 

        $('#clearHistory')
            .click( function () {
                fetch(`/deleteHistory`, {
                    method : 'DELETE'
                })
                .then( resp => {
                    return resp.json();
                })
                .then( data => {
                    if(data.deleted) {
                        $('#historyTable tbody').get(0).childNodes.forEach( task => {
                            $(task).fadeOut
                        })
                        $('#historyTable tbody').html('');
                    }
                })
            })

        // Load The Task Options Handler

        $('#taskContainer')
            .click( function (ev) {
                const target = $(ev.target);
                const task = target.parents('.task');

                if(!$(task).data()) return;
            
                const taskId = task.data().dataId;

                if(target.hasClass('taskCompleted')) {

                    fetch(`/deleteTask`, {
                        method : 'DELETE',
                        body : JSON.stringify({
                            Id : taskId,
                            Done : true
                        }),
                        headers : {
                            'Content-Type' : 'application/json'
                        }
                    })
                    .then( resp => {
                        if(resp.status === 404) throw new Error();
                        return resp.json();
                    })
                    .then( data => {
                        modifyTaskHistory(data);
                        $(task).fadeOut(500, function () {
                            this.remove();
                        });
                    });
                }
                
                else if(target.hasClass('taskDeleted')) {

                    fetch(`/deleteTask`, {
                        method : 'DELETE',
                        body : JSON.stringify({
                            Id : taskId
                        }),
                        headers : {
                            'Content-Type' : 'application/json'
                        }
                    })
                    .then( resp => {
                        if(resp.status === 404) throw new Error();
                        return resp.json();
                    })
                    .then( data => {
                        modifyTaskHistory(data);
                        $(task).fadeOut(500, function () {
                            this.remove();
                        });
                    });
                }

                else if (target.hasClass('taskEdit')) {
                    $('#formEditTitle').val(task.children('#taskTitle').text());
                        $('#formEditBody').val(task.children('#taskBody').text());
                        editTaskObj.Elem = task;
                        editTaskObj.Id = taskId;
                }
            });


        function submitTask () {
    
            fetch(`/addTask`, {
                method: 'PUT',
                body: JSON.stringify({
                    Title : $('#formAddTitle').val(),
                    Body : $('#formAddBody').val()
                }),
                headers: {
                    'Content-Type' : 'application/json'
                }
            })
            .then(resp => {
                return resp.json();
            })
            .then( data => {
                renderTask(data);
                addTaskToHistory(data);
            })
            .catch( err => {
                console.log(err);
            });
        }
    
        function editTask () {
            fetch(`/editTask`, {
                method: 'PUT',
                body: JSON.stringify({
                    Title : $('#formEditTitle').val(),
                    Body : $('#formEditBody').val(),
                    editObj : editTaskObj
                }),
                headers: {
                    'Content-Type' : 'application/json'
                }
            })
            .then( resp => {
                if(resp.status === 404) throw new Error();
                return resp.json();
            })
            .then( data => {
                $(editTaskObj.Elem).children('#taskTitle').text(data.Title);
                $(editTaskObj.Elem).children('#taskBody').text(data.Body);
                modifyTaskHistory(data);
            });
        }

        function modifyTaskHistory (taskObj) {
            const rows = $('#historyTable tbody').children();
            let color;
    
            switch(taskObj.State) {
                case 'Completed' : 
                    color = 'success';
                    break;
                case 'Deleted' : 
                    color = 'danger';
                    break;
                case 'Uncompleted' : 
                    color = 'warning';
                    break;
            }
    
            for(let task of rows) {
                if($(task).data().dataId === taskObj.Id){
                    $(task).children(':first-child').text(taskObj.Title);
                    $(task).children(':nth-child(2)').text(taskObj.Body);
                    $(task).children(':last-child')
                        .removeClass( function () {
                            return this.className.match(/text-[\w]+\b/g)[0];
                        })
                        .addClass(`text-${color}`)
                        .html( () => {
                            return taskObj.stateDate ? `${taskObj.State}<br>${taskObj.stateDate}` : `${taskObj.State}`;
                        });
                }
            }
        }
    
        function emptyFormFields (action) {
            $(`#form${action}Title`).val('');
            $(`#form${action}Body`).val('');
        }
    
        function disableButton (...bttnIds) {
            bttnIds.forEach( id => $(`#${id}`).prop('disabled', true).css('opacity', 0.5))
        }
    
        function enableButton (...bttnIds) {
            bttnIds.forEach( id => $(`#${id}`).prop('disabled', false).css('opacity', 1))
        }

        
        
    }

    function renderTask (formObj) {
        const template = document.getElementById('taskElem');
        const task = getFragContent(template.content.cloneNode(true));
        $(task).data('data-id', formObj.Id);
        $(task.querySelector('#taskTitle')).text(formObj.Title);
        $(task.querySelector('#taskBody')).text(formObj.Body);

        $('#taskContainer').append(task);
    }

    function addTaskToHistory(taskObj) {
        const row = document.createElement('TR');

        $(row).data('data-id', taskObj.Id);

        $(row)
            .append([
                `<td>${taskObj.Title}</td>`,
                `<td>${taskObj.Body}</td>`,
                `<td>${taskObj.Date}</td>`
            ])
            .append( () => {
                const stateText = (taskObj.State + '<br>' + (taskObj.stateDate ? taskObj.stateDate : ''));
                let color; 

                switch(taskObj.State) {
                    case 'Completed' : 
                        color = 'success';
                        break;
                    case 'Deleted' : 
                        color = 'danger';
                        break;
                    case 'Uncompleted' : 
                        color = 'warning';
                        break;
                }

                return `<td class="text-${color} font-weight-bold">${stateText}</td>`;
            });

        $('#taskHistoryModal table tbody').append(row);
    }

    function getFragContent (frag) {
        const div = document.createElement('DIV');
        div.appendChild(frag);
        return div.children[0];
    }

    window.addEventListener('load', init);

})();