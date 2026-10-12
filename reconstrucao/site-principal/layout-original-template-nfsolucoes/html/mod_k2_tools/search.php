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

/*
Important note:
If you wish to use the live search option, it's important that you maintain the same class names for wrapping elements, e.g. the wrapping div and form.
*/

?>
<form method="post" action="<?php echo $action; ?>" class="searh-holder" method="get" autocomplete="off" >
	<input type="text"  class="search" placeholder="<?php echo JText::_('TPL_CASHEMIR_SEARCH_TEXT');?>" name="searchword" />
  	<button class="search-submit" type="submit" ><i class="fa fa-search transition"></i></button>
  	<input type="hidden" name="categories" value="<?php echo $categoryFilter; ?>" />
		<?php if(!$app->getCfg('sef')): ?>
		<input type="hidden" name="option" value="com_k2" />
		<input type="hidden" name="view" value="itemlist" />
		<input type="hidden" name="task" value="search" />
		<?php endif; ?>
		<?php if($params->get('liveSearch')): ?>
		<input type="hidden" name="format" value="html" />
		<input type="hidden" name="t" value="" />
		<input type="hidden" name="tpl" value="search" />
		<?php endif; ?>
</form>
<?php if($params->get('liveSearch')): ?>
	<div class="k2LiveSearchResults"></div>
<?php endif; ?>
