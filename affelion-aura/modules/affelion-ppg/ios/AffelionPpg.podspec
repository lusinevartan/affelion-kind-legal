Pod::Spec.new do |s|
  s.name           = 'AffelionPpg'
  s.version        = '1.0.0'
  s.summary        = 'Rear-camera photoplethysmography with torch for Affelion Aura'
  s.description    = 'Captures mean RGB of the rear camera at 30 fps with the torch on and exposure locked.'
  s.author         = 'Affelion'
  s.homepage       = 'https://affelion.com'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'CoreMedia', 'CoreVideo'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
