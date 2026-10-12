<?php
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
defined('_JEXEC') or die;

?>
<div <?php echo (!empty($id)? 'id="'.$id.'"' : ''); ?> <?php echo (!empty($class)? 'class="'.$class.'"' : ''); ?>>
	<?php if($showtitle) : ?>
		<h3><?php echo $module->title;?></h3>
	<?php endif;?>
	<?php echo $module->content;?>
</div>