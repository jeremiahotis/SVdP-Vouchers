<div class="svdp-reasons-section">
    <h2>Override Reasons</h2>
    <p>Manage the dropdown list of reasons shown when approving emergency voucher overrides. Drag to reorder.</p>

    <div class="svdp-admin-section">
        <h3>Add New Reason</h3>
        <div class="svdp-form-inline">
            <input type="text" id="svdp-new-reason-text" placeholder="Reason text" style="width: 400px;">
            <button type="button" id="svdp-add-reason" class="button button-primary">Add Reason</button>
        </div>
    </div>

    <div class="svdp-admin-section">
        <h3>Existing Reasons</h3>
        <p class="description">Drag and drop to reorder how reasons appear in the dropdown.</p>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 50px;">Order</th>
                    <th>Reason Text</th>
                    <th style="width: 100px;">Status</th>
                    <th style="width: 150px;">Actions</th>
                </tr>
            </thead>
            <tbody id="svdp-reasons-list" class="svdp-sortable">
                <tr>
                    <td colspan="4">Loading...</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Edit Reason Modal -->
<div id="svdp-edit-reason-modal" class="svdp-modal" style="display: none;">
    <div class="svdp-modal-content">
        <h3>Edit Reason</h3>
        <input type="hidden" id="svdp-edit-reason-id">
        <p>
            <label>Reason Text:</label><br>
            <input type="text" id="svdp-edit-reason-text" style="width: 100%; max-width: 400px;">
        </p>
        <button type="button" class="button button-primary" id="svdp-save-reason-edit">Save</button>
        <button type="button" class="button" onclick="document.getElementById('svdp-edit-reason-modal').style.display='none'">Cancel</button>
    </div>
</div>

<style>
.svdp-sortable tr {
    cursor: move;
}

.svdp-sortable tr:hover {
    background-color: #f0f0f0;
}

.reason-status-active {
    color: #46b450;
}

.reason-status-inactive {
    color: #dc3232;
}

.svdp-drag-handle {
    cursor: move;
    color: #999;
}

.svdp-drag-handle:before {
    content: "⠿";
    font-size: 18px;
}
</style>
