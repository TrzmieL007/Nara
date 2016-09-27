library(shiny)
library(ggplot2)

ui <- shinyUI(fluidPage(
  
  titlePanel("Params module for ggplot2"),
  
  sidebarLayout(
    sidebarPanel(
      ggThemeParamsUI("ggThemes")
    ),
    
    mainPanel(
      plotOutput("plot")
    )
  )
))

server <- shinyServer(function(input, output) {
  
  themes = callModule(ggMakeThemeParams, "ggThemes")
  
  output$plot <- renderPlot({
    data("mtcars")
    
    p = ggplot(mtcars, aes(mpg, disp, fill = cyl)) + geom_point(size = themes$pointSize)
    p = themes$call(p)
    
    return(p)
  })
})

shinyApp(ui = ui, server = server)

