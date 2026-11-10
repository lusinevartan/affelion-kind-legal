Pod::Spec.new do |s|
  s.name           = 'AffelionSilhouette'
  s.version        = '1.0.0'
  s.summary        = 'Front-camera face and person-silhouette tracking for Affelion Aura'
  s.description    = 'ARKit face tracking with Vision person segmentation, falling back to AVFoundation + Vision face detection.'
  s.author         = 'Affelion'
  s.homepage       = 'https://affelion.com'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'ARKit', 'Vision', 'AVFoundation', 'CoreImage', 'SceneKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
