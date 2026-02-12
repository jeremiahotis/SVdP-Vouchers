<div class="svdp-catalog-tab">
    <div class="svdp-card">
        <h2>Furniture Catalog</h2>
        <p class="description">Manage the global list of furniture items available for vouchers.</p>

        <form id="svdp-add-furniture-item" class="svdp-catalog-form" data-catalog-type="furniture">
            <table class="form-table">
                <tr>
                    <th><label for="furniture_category">Category *</label></th>
                    <td>
                        <select id="furniture_category" name="category" required>
                            <option value="">Select a category...</option>
                            <?php foreach (SVDP_Catalog::get_categories('furniture') as $category): ?>
                                <option value="<?php echo esc_attr($category); ?>"><?php echo esc_html($category); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th><label for="furniture_name">Item Name *</label></th>
                    <td><input type="text" id="furniture_name" name="name" class="regular-text" required></td>
                </tr>
                <tr>
                    <th><label for="furniture_min_price">Min Price *</label></th>
                    <td><input type="number" id="furniture_min_price" name="min_price" step="0.01" min="0" required></td>
                </tr>
                <tr>
                    <th><label for="furniture_max_price">Max Price *</label></th>
                    <td><input type="number" id="furniture_max_price" name="max_price" step="0.01" min="0" required></td>
                </tr>
                <tr>
                    <th><label for="furniture_is_woodshop">Woodshop Item</label></th>
                    <td>
                        <label>
                            <input type="checkbox" id="furniture_is_woodshop" name="is_woodshop" class="catalog-woodshop-toggle" value="1">
                            This item is built by the woodshop
                        </label>
                    </td>
                </tr>
                <tr>
                    <th><label for="furniture_availability">Availability</label></th>
                    <td>
                        <select id="furniture_availability" name="availability_status" class="catalog-availability">
                            <option value="available">Available</option>
                            <option value="out_of_stock">Out of stock</option>
                        </select>
                        <p class="description">Availability applies only to woodshop items.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="furniture_sort_order">Sort Order</label></th>
                    <td><input type="number" id="furniture_sort_order" name="sort_order" value="0" class="small-text"></td>
                </tr>
            </table>
            <p class="submit">
                <button type="submit" class="button button-primary">Add Furniture Item</button>
            </p>
        </form>
        <div id="furniture-item-message"></div>
    </div>

    <div class="svdp-card">
        <h2>Existing Furniture Items</h2>
        <table class="wp-list-table widefat fixed striped" style="table-layout: auto;">
            <thead>
                <tr>
                    <th style="width: 22%;">Item</th>
                    <th style="width: 20%;">Category</th>
                    <th style="width: 12%;">Min Price</th>
                    <th style="width: 12%;">Max Price</th>
                    <th style="width: 8%;">Woodshop</th>
                    <th style="width: 10%;">Availability</th>
                    <th style="width: 10%;">Sort</th>
                    <th style="width: 10%;">Active</th>
                    <th style="width: 10%;">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $items = SVDP_Catalog::get_items('furniture', false);
                if (empty($items)): ?>
                    <tr><td colspan="9">No furniture items yet.</td></tr>
                <?php else:
                    foreach ($items as $item): ?>
                        <tr data-id="<?php echo esc_attr($item->id); ?>" data-catalog-type="furniture">
                            <td>
                                <input type="text" class="catalog-name" value="<?php echo esc_attr($item->name); ?>" style="width: 100%;">
                            </td>
                            <td>
                                <select class="catalog-category">
                                    <?php foreach (SVDP_Catalog::get_categories('furniture') as $category): ?>
                                        <option value="<?php echo esc_attr($category); ?>" <?php selected($item->category, $category); ?>>
                                            <?php echo esc_html($category); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                            <td><input type="number" class="catalog-min-price" value="<?php echo esc_attr($item->min_price); ?>" step="0.01" min="0"></td>
                            <td><input type="number" class="catalog-max-price" value="<?php echo esc_attr($item->max_price); ?>" step="0.01" min="0"></td>
                            <td style="text-align: center;">
                                <input type="checkbox" class="catalog-woodshop-toggle" <?php checked($item->is_woodshop, 1); ?>>
                            </td>
                            <td>
                                <select class="catalog-availability">
                                    <option value="available" <?php selected($item->availability_status, 'available'); ?>>Available</option>
                                    <option value="out_of_stock" <?php selected($item->availability_status, 'out_of_stock'); ?>>Out of stock</option>
                                </select>
                            </td>
                            <td><input type="number" class="catalog-sort-order" value="<?php echo esc_attr($item->sort_order); ?>" class="small-text"></td>
                            <td style="text-align: center;">
                                <input type="checkbox" class="catalog-active" <?php checked($item->active, 1); ?>>
                            </td>
                            <td>
                                <button class="button button-small svdp-update-catalog-item">Update</button>
                            </td>
                        </tr>
                    <?php endforeach;
                endif; ?>
            </tbody>
        </table>
    </div>
</div>
