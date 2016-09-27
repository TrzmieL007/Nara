library(shiny)
library(ggplot2)

ui <- shinyUI(fluidPage(
   
   titlePanel("Facets module for ggplot2"),
   
   sidebarLayout(
      sidebarPanel(
        ggFacetGridUI("facet")
      ),
      
   mainPanel(
      plotOutput("plot")
   )
   )
))

server <- shinyServer(function(input, output) {
  
  facetGrid = callModule(ggMakeFacetGrid, "facet", columns = c("vs","am","gear","carb"))
   
  output$plot <- renderPlot({
    data("mtcars")
    
    p = ggplot(mtcars, aes(mpg, disp)) + geom_point()
    
    p = facetGrid$call(p)
      
    
    return(p)
  })
})

shinyApp(ui = ui, server = server)

