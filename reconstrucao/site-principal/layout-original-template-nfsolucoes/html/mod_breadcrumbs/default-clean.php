<?php
/**
 * @package Cashemir - Responsive One Page Joomla Template
 * @author Cththemes - www.cththemes.com
 * @date: 29-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */


defined('_JEXEC') or die;

//$separator = '<i class="breadcrumbs-arrow icon-right-dir"></i>';

// Find last and penultimate items in breadcrumbs list
end($list);
$last_item_key = key($list);
prev($list);
$penult_item_key = key($list);

?>
<div class="sections simple-page-head bg-fx">
	<div class="content">
		<div class="rester"></div>
		<div class="rester black"></div>
		<div class="container">
			<h2><?php echo strip_tags($list[$last_item_key]->name);?></h2>
			<div class="small-separator"></div>
		</div>
	</div>

</div>


