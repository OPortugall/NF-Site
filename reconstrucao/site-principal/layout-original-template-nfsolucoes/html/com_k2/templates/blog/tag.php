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

?>

<!-- Start K2 Tag Layout -->

	<?php if(count($this->items)): ?>
		<?php foreach($this->items as $item){

			echo $this->loadTemplate('item');

		}
	 ?>

	 <!-- Pagination -->
	<?php if($this->pagination->getPagesLinks()): ?>
	<!-- Unofficial pagination -->
		<div class="clear"></div>
		<?php echo $this->pagination->getPagesLinks(); ?>
	<?php endif; ?>

	<?php endif; ?>

<!-- End K2 Tag Layout -->
