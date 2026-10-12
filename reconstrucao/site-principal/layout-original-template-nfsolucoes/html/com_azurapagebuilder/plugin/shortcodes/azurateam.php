<?php
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
//no direct accees
defined ('_JEXEC') or die('resticted aceess');

//[carousel]
if(!function_exists('azurateam_sc')) {
	$AzuraTeamMemberArray = array();
	function azurateam_sc( $atts, $content="" ){
		global $AzuraTeamMemberArray;
		
		$params = shortcode_atts(array(
			  'id' => '',
			  'class'=>''
		 ), $atts);

		$classes = '';
		if ($params['class']) {
			$classes = 'class="'.$params['class'].'"';
		}

		$id = '';
		if ($params['id']) {
			$id = 'id="'.$params['id'].'"';
		}
		
		do_shortcode( $content );

		$html ='';
		
		//$html .= '<div id="' . $params['id'] . '" '.$classes.' '. $styles.'>';


		
		
		//members
		foreach ($AzuraTeamMemberArray as $key=>$member) {
			$html .= '<div class="member-box'. (!empty($member['class']) ? " ".$member['class'] : "").'">';
						
				$html .= '<div class="moreinfo notvisible">';
				if(!empty($member['photo'])){
					$html .= '<img src="'.JURI::base(true).'/'.$member['photo'].'" class="member-photo respimg" alt="'.$member['name'].'" title="'.$member['name'].'">';
				}
					
					$html .= '<div class="member-skils">';
						$html .= '<div class="overlay  team-overlay"></div>';
						$html .= '<div class="skillbar-holder ms">';

						if(!empty($member['skillOne'])){
							list($skillOneTitle, $skillOnePercent) = explode("|", $member['skillOne']);

							$html .= '<div class="skillbar-title-member" ><span>'.$skillOneTitle.'</span></div>';
							$html .= '<div class="skill-bar-percent-member">'.(int)$skillOnePercent.'%</div>';
							$html .= '<div class="skillbar-member" data-percent="'.(int)$skillOnePercent.'%">';
								$html .= '<div class="skillbar-bar-member"></div>';
							$html .= '</div>';
						}
								
						if(!empty($member['skillTwo'])){
							list($skillTwoTitle, $skillTwoPercent) = explode("|", $member['skillTwo']);

							$html .= '<div class="skillbar-title-member" ><span>'.$skillTwoTitle.'</span></div>';
							$html .= '<div class="skill-bar-percent-member">'.(int)$skillTwoPercent.'%</div>';
							$html .= '<div class="skillbar-member" data-percent="'.(int)$skillTwoPercent.'%">';
								$html .= '<div class="skillbar-bar-member"></div>';
							$html .= '</div>';
						}

						if(!empty($member['skillThree'])){
							list($skillThreeTitle, $skillThreePercent) = explode("|", $member['skillThree']);

							$html .= '<div class="skillbar-title-member" ><span>'.$skillThreeTitle.'</span></div>';
							$html .= '<div class="skill-bar-percent-member">'.(int)$skillThreePercent.'%</div>';
							$html .= '<div class="skillbar-member" data-percent="'.(int)$skillThreePercent.'%">';
								$html .= '<div class="skillbar-bar-member"></div>';
							$html .= '</div>';
						}
																
						$html .= '</div>';
						$html .= '<div class="clear"></div>';
						if(!empty($member['introduction'])){
						$html .= '<p class="clear">'.$member['introduction'].'</p>';
						}
						if(!empty($member['facebookLink'])||!empty($member['linkedInLink'])||!empty($member['twitterLink'])||!empty($member['dribbbleLink'])||!empty($member['googlePlusLink'])){
							$html .= '<div class="member-social-list">';
							
							$html .= '<ul>	';
								if(!empty($member['facebookLink'])){
									$html .= '<li><a href="'.$member['facebookLink'].'"  target="_blank" class="transition"><i class="fa fa-facebook fa-1x"></i></a></li>';
								}				
								if(!empty($member['linkedInLink'])){
									$html .= '<li><a href="'.$member['linkedInLink'].'"  target="_blank" class="transition"><i class="fa fa-linkedin fa-1x"></i></a></li>';
								}
								if(!empty($member['twitterLink'])){
									$html .= '<li><a href="'.$member['twitterLink'].'"  target="_blank" class="transition"><i class="fa fa-twitter fa-1x"></i></a></li>';
								}
								if(!empty($member['dribbbleLink'])){
									$html .= '<li><a href="'.$member['dribbbleLink'].'"  target="_blank" class="transition"><i class="fa fa-dribbble fa-1x"></i></a></li>';
								}
								if(!empty($member['googlePlusLink'])){
									$html .= '<li><a href="'.$member['googlePlusLink'].'"  target="_blank" class="transition"><i class="fa fa-google-plus fa-1x"></i></a></li>';
								}
							
							$html .= '</ul>';
								
						$html .= '</div>';
						}
						
					$html .= '</div>';
				$html .= '</div>';
											
				$html .= '<h3>'.$member['name'].'</h3>';
				$html .= '<span>'.$member['position'].'</span>';
											  
			$html .= '</div>';

			//$html .='<div class="item'. (!empty($azuraCarousel['class']) ? " ".$azuraCarousel['class'] : "").'" '. (!empty($azuraCarousel['id']) ? " id=\"".$azuraCarousel['id']."\"" : "").'>' . do_shortcode( $azuraCarousel['content'] ) . '</div>';
		}
		
		//$html .='</div>';
	
		$AzuraTeamMemberArray = array();	
		return $html;

	}
	
	add_shortcode( 'AzuraTeam', 'azurateam_sc' );
		
	//carousel Items
	function azurateam_member_sc( $atts, $content="" ){
		global $AzuraTeamMemberArray;
		$AzuraTeamMemberArray[] = array(
											'id'=>(!empty($atts['id'])? $atts['id'] : ''),
											'class'=>(!empty($atts['class'])? $atts['class'] : ''),

											'name'=>(!empty($atts['memname'])? $atts['memname'] : ''), 
											'position'=>(!empty($atts['memposition'])? $atts['memposition'] : ''),
											'photo'=>(!empty($atts['memphoto'])? $atts['memphoto'] : ''),
											'introduction'=>(!empty($atts['memintroduction'])? $atts['memintroduction'] : ''), 

											'skillOne'=>(!empty($atts['memskillone'])? $atts['memskillone'] : ''),
											'skillTwo'=>(!empty($atts['memskilltwo'])? $atts['memskilltwo'] : ''),
											'skillThree'=>(!empty($atts['memskillthree'])? $atts['memskillthree'] : ''), 

											'facebookLink'=>(!empty($atts['memfacebook'])? $atts['memfacebook'] : ''),
											'linkedInLink'=>(!empty($atts['memlinkedin'])? $atts['memlinkedin'] : ''),
											'twitterLink'=>(!empty($atts['memtwitter'])? $atts['memtwitter'] : ''),
											'dribbbleLink'=>(!empty($atts['memdribbble'])? $atts['memdribbble'] : ''),
											'googlePlusLink'=>(!empty($atts['memgoogleplus'])? $atts['memgoogleplus'] : ''),
											'content'=>$content);
	}

	add_shortcode( 'AzuraTeamMember', 'azurateam_member_sc' );			
}