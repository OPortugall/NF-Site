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
JHtml::_('formbehavior.chosen', 'select');
?>
<div class="section-content search-section <?php echo $this->pageclass_sfx; ?>">
  <div class="container">
      <div class="row">
		<div class="col-md-12">

		<?php if ($this->params->get('show_page_heading', 1)) : ?>
		<h1 class="page-header">
			<?php if ($this->escape($this->params->get('page_heading'))) :?>
				<?php echo $this->escape($this->params->get('page_heading')); ?>
			<?php else : ?>
				<?php echo $this->escape($this->params->get('page_title')); ?>
			<?php endif; ?>
		</h1>
		<?php endif; ?>

		<?php echo $this->loadTemplate('form'); ?>
		<?php if ($this->error == null && count($this->results) > 0) :
			echo $this->loadTemplate('results');
		else :
			echo $this->loadTemplate('error');
		endif; ?>
		</div>

	 </div>
</div>