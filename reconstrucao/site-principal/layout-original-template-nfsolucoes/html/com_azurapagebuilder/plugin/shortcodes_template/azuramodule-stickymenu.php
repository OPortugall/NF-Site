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

$params = JFactory::getApplication()->getTemplate(true)->params;
$sitename = JFactory::getApplication()->getCfg('sitename');
$pageType = $params->get('pageType','onePage');

$logoImage = $params->get('logoImage');
$logoText = $params->get('logoText');
$logo = '';
if(!empty($logoImage)){
	$logo .= '<img src="'.JURI::base(true).'/'.$logoImage.'" class="logo" title="'.$sitename.'" alt="'.$sitename.'">';
}elseif(!empty($logoText)){
	$logo .= '<h1><a href="index.php#intro"'.(($pageType == 'onePage')? ' class="scroll-link"': '').'>'.$logoText.'</a></h1>';
}elseif(empty($logo)){
	$logo .= '<h1><a href="index.php#intro"'.(($pageType == 'onePage')? ' class="scroll-link"': '').'>'.$sitename.'</a></h1>';
}

?>
<div class="inner">
	<?php echo $logo;?>
	
	<div <?php echo (!empty($id)? 'id="'.$id.'"' : ''); ?> <?php echo (!empty($class)? 'class="'.$class.'"' : ''); ?>>
		<?php if($showtitle) : ?>
			<h3><?php echo $module->title;?></h3>
		<?php endif;?>
		<?php echo $module->content;?>
	</div>
	
</div>
