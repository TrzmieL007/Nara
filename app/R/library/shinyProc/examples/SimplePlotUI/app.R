
library(shiny)

flog.threshold(TRACE)


ui <- shinyUI(fluidPage(
   
   # Application title
   titlePanel("Simple plot UI - example"),
   
   sidebarLayout(
      sidebarPanel(
        simplePlotUI("plotUI"),
        actionButton("iter", label = "Change value!")
      ),
      
      # Show a plot of the generated distribution
      mainPanel(
         verbatimTextOutput("text")
      )
   )
))

server <- shinyServer(function(input, output) {

  xcols = reactive(
  {  x = input$iter
    flog.trace("XCols triggered.")
    x:(x+10)
  })
  
  
  plui = callModule(makeSimplePlotUI, id = "plotUI", xcols = xcols)
  
  output$text = renderPrint({
      plui()  
  })   
})

# Run the application 
shinyApp(ui = ui, server = server)

