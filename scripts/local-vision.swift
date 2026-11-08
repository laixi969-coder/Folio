import Foundation
import Vision
import ImageIO

struct Item: Decodable { let src: String; let path: String }
struct Label: Encodable { let id: String; let confidence: Float }
struct Result: Encodable { let src: String; let width: Int?; let height: Int?; let labels: [Label]; let faces: Int; let error: Bool }
let input = FileHandle.standardInput.readDataToEndOfFile()
do {
 let items = try JSONDecoder().decode([Item].self, from: input)
 var results: [Result] = []
 for item in items {
  let url = URL(fileURLWithPath: item.path)
  do {
   let classify = VNClassifyImageRequest()
   let faces = VNDetectFaceRectanglesRequest()
   let handler = VNImageRequestHandler(url: url, options: [:])
   try handler.perform([classify, faces])
   let labels = (classify.results ?? []).prefix(8).map { Label(id: $0.identifier, confidence: $0.confidence) }
   let source = CGImageSourceCreateWithURL(url as CFURL, nil)
   let props = source.flatMap { CGImageSourceCopyPropertiesAtIndex($0, 0, nil) as? [CFString: Any] }
   let width = props?[kCGImagePropertyPixelWidth] as? Int
   let height = props?[kCGImagePropertyPixelHeight] as? Int
   let orientation = props?[kCGImagePropertyOrientation] as? Int ?? 1
   let rotated = (5...8).contains(orientation)
   results.append(Result(src: item.src, width: rotated ? height : width, height: rotated ? width : height, labels: labels, faces: faces.results?.filter { $0.confidence >= 0.7 }.count ?? 0, error: false))
  } catch { results.append(Result(src: item.src, width: nil, height: nil, labels: [], faces: 0, error: true)) }
 }
 let output = try JSONEncoder().encode(results)
 FileHandle.standardOutput.write(output)
} catch { FileHandle.standardError.write(Data("invalid input".utf8)); exit(1) }
