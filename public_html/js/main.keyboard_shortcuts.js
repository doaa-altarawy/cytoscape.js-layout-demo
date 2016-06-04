

$(document).keydown(function (e) {
// Undo / Redo from keyboard
    if (e.ctrlKey) {
        window.ctrlKeyDown = true;
        if (e.which === 90) {
            editorActionsManager.undo();
            refreshUndoRedoButtonsStatus();
        }
        else if (e.which === 89) {
            editorActionsManager.redo();
            refreshUndoRedoButtonsStatus();
        }
    }
// Delete selected
    if(e.which === 46) {
        $("#delete").click();
    }
});