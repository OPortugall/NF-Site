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

JHtml::_('bootstrap.tooltip');

$lang = JFactory::getLanguage();
$upper_limit = $lang->getUpperLimitSearchWord();
?>
<form id="searchForm" action="<?php echo JRoute::_('index.php?option=com_search');?>" method="post">
	
	<div class="row">
	  <div class="col-lg-6">
	    <div class="input-group">
	      <input type="text" name="searchword" placeholder="<?php echo JText::_('COM_SEARCH_SEARCH_KEYWORD'); ?>" id="search-searchword" size="30" maxlength="<?php echo $upper_limit; ?>" value="<?php echo $this->escape($this->origkeyword); ?>" class="form-control" />
	      <span class="input-group-btn">
	        <button name="Search" onclick="this.form.submit()" class="btn btn-default hasTooltip" title="<?php echo JHtml::tooltipText('COM_SEARCH_SEARCH');?>"><span class="fa fa-search"></span></button>
	      </span>
	      <input type="hidden" name="task" value="search" />
	    </div><!-- /input-group -->
	  </div><!-- /.col-lg-6 -->
	  <div class="col-lg-6 <?php echo $this->params->get('pageclass_sfx'); ?>">
		<?php if (!empty($this->searchword)):?>
		<p><?php echo JText::plural('COM_SEARCH_SEARCH_KEYWORD_N_RESULTS', '<span class="badge badge-info">'. $this->total. '</span>');?></p>
		<?php endif;?>
	  </div>
  	</div>

	<h3 class="page-header"><?php echo JText::_('COM_SEARCH_FOR');?></h3>
	<div class="phrases-box">
		<?php echo $this->lists['searchphrase']; ?>
		</div>
		<div class="ordering-box">
		<label for="ordering" class="ordering">
			<?php echo JText::_('COM_SEARCH_ORDERING');?>
		</label>
		<?php echo $this->lists['ordering'];?>
	</div>

	<?php if ($this->params->get('search_areas', 1)) : ?>
		<h3 class="page-header"><?php echo JText::_('COM_SEARCH_SEARCH_ONLY');?></h3>
		<?php foreach ($this->searchareas['search'] as $val => $txt) :
			$checked = is_array($this->searchareas['active']) && in_array($val, $this->searchareas['active']) ? 'checked="checked"' : '';
		?>
		<label for="area-<?php echo $val;?>" class="checkbox-inline">
			<input type="checkbox" name="areas[]" value="<?php echo $val;?>" id="area-<?php echo $val;?>" <?php echo $checked;?> >
			<?php echo JText::_($txt); ?>
		</label>
		<?php endforeach; ?>
	<?php endif; ?>

<?php if ($this->total > 0) : ?>

	<h3 class="page-header"><?php echo JText::_('COM_SEARCH_RESULT_FOR'). $this->escape($this->origkeyword);?></h3>

	<div class="form-limit pt20">
		<label for="limit">
			<?php echo JText::_('JGLOBAL_DISPLAY_NUM'); ?>
		</label>
		<?php echo $this->pagination->getLimitBox(); ?>
	</div>

<?php endif; ?>

</form>
