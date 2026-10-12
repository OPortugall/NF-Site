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

// Get user stuff (do not change)
$user = JFactory::getUser();
$app = JFactory::getApplication();
$categories = $app->getMenu()->getActive()->params->get('categories');

require_once (JPATH_SITE.DS.'modules'.DS.'mod_k2_tools'.DS.'helper.php');
$cats = array();
foreach ($categories as $cat) {
	$subCat = modK2ToolsHelper::getCategoryChildren($cat);
	$cats = array_merge($cats, $subCat);
	array_unshift($cats, $cat);
}
$cats = array_unique($cats);
?>
<?php if(isset($this->items) && count($this->items)) : ?>
<!-- Start K2 User Layout -->
<!-- Items -->
	<?php foreach($this->items as $item){
		$catid = $item->catid;
		if(in_array($catid, $cats)){
			// Load user_item.php by default
			$this->item=$item;
			echo $this->loadTemplate('item');
			//echo'<pre>';var_dump($item);die;
		}
		

	} ?>
	
	<!-- Pagination -->
	<?php if($this->pagination->getPagesLinks()): ?>
	<!-- Unofficial pagination -->
		<div class="clear"></div>
		<?php if($this->params->get('catPagination')) echo $this->pagination->getPagesLinks(); ?>
	<?php endif; ?>
<?php else: ?>

	<?php if(!$this->params->get('googleSearch')): ?>
	<!-- No results found -->
	<div id="genericItemListNothingFound">
		<p><?php echo JText::_('K2_NO_RESULTS_FOUND'); ?></p>
	</div>
	<?php endif; ?>

<?php endif;?>
