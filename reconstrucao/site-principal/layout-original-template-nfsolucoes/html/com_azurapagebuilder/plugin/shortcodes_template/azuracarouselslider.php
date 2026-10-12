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
<div class="item<?php echo (!empty($azuraCarousel['class']) ? " ".$azuraCarousel['class'] : "");?>" <?php echo (!empty($azuraCarousel['id']) ? " id=\"".$azuraCarousel['id']."\"" : "");?>>
<?php if(!empty($azuraCarousel['image'])) :?>
    <img alt="About <?php echo (JFactory::getApplication()->getCfg('sitename'));?>" src="<?php echo JURI::base(true).'/'.$azuraCarousel['image'];?>">
<?php else: ?>
    <?php echo do_shortcode( $azuraCarousel['content'] );?>
<?php endif;?>
</div>