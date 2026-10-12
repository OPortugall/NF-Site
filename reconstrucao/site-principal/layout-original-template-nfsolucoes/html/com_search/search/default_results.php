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
?>

<div class="search-results <?php echo $this->pageclass_sfx; ?>">
<?php foreach ($this->results as $result) : ?>
	<div class="content-data">

		<h2><?php echo $this->pagination->limitstart + $result->count.'. ';?>
		<?php if ($result->href) :?>
			<a href="<?php echo JRoute::_($result->href); ?>"<?php if ($result->browsernav == 1) :?> target="_blank"<?php endif;?>>
				<?php echo $this->escape($result->title);?>
			</a>
		<?php else:?>
			<?php echo $this->escape($result->title);?>
		<?php endif; ?></h2>

	<?php if ($result->section) : ?>
			<p>
				(<?php echo $this->escape($result->section); ?>)
			</p>
	<?php endif; ?>
	</div>

	<span>
		<?php echo $result->text; ?>
	</span>
	<?php if ($this->params->get('show_date')) : ?>
		<p>
			<?php echo JText::sprintf('JGLOBAL_CREATED_DATE_ON', $result->created); ?>
		</p>
	<?php endif; ?>

<?php endforeach; ?>
</div>

<div class="pagination">
	<?php echo $this->pagination->getPagesLinks(); ?>
</div>
