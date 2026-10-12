<?php
/**
 * @package Cashemir - Responsive One Page Joomla Template
 * @author Cththemes - www.cththemes.com
 * @date: 29-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */

// no direct access
defined('_JEXEC') or die;


$categories = JFactory::getApplication()->getMenu()->getActive()->params->get('categories');

require_once (JPATH_SITE.DS.'modules'.DS.'mod_k2_tools'.DS.'helper.php');
$cats = array();
foreach ($categories as $cat) {
	$subCat = modK2ToolsHelper::getCategoryChildren($cat);
	$cats = array_merge($cats, $subCat);
	array_unshift($cats, $cat);
}
$cats = array_unique($cats);
?>


<!-- Start K2 Generic (search/date) Layout -->

	<?php if(count($this->items)): 
$total = count($this->items);
	?>
	<?php foreach($this->items as $key=>$item): ?>

	<!-- Start K2 Item Layout -->
	<?php 
		$catid = $item->catid;
		if(in_array($catid, $cats)){
			// Load user_item.php by default
			$this->item=$item;
			echo $this->loadTemplate('item');
			//echo'<pre>';var_dump($item);die;
		}
	?>

	<?php endforeach; ?>

	<!-- End K2 Item Layout -->

	<!-- Pagination -->
	<?php if($this->pagination->getPagesLinks()): ?>
	<!-- Unofficial pagination -->
	<div class="clear"></div>
		<?php echo $this->pagination->getPagesLinks(); ?>

	<?php endif; ?>

	<?php else: ?>

	<?php if(!$this->params->get('googleSearch')): ?>
	<!-- No results found -->
	<div id="genericItemListNothingFound">
		<p><?php echo JText::_('K2_NO_RESULTS_FOUND'); ?></p>
	</div>
	<?php endif; ?>

	<?php endif; ?>

<!-- End K2 Generic (search/date) Layout -->
